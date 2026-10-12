import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import md5 from 'md5';
import config from '../../common/config';
import { ok, ApiResult } from '../../common/result';
import { setToken } from '../../common/utils/token.util';
import { getRequestContext } from '../../common/request-context';
import { BusinessException, ValidateException } from '../../common/exceptions/business.exception';
import { RedisService } from '../../redis/redis.service';
import { SystemAuthAdmin } from '../../models/system-auth-admin.model';
import { AuthAdminService } from './services/auth-admin.service';
import { CommonService } from './services/common.service';

const { backstageTokenSet, backstageTokenKey, reqRoleIdKey } = config;

@Controller('api')
export class SystemController {
  constructor(
    @InjectModel(SystemAuthAdmin) private readonly adminModel: typeof SystemAuthAdmin,
    private readonly redis: RedisService,
    private readonly authAdmin: AuthAdminService,
    private readonly common: CommonService,
  ) {}

  @Post('system/login')
  async login(@Body() body: any): Promise<ApiResult> {
    // 等价于原 egg-validate 规则
    // { username: { type: 'string', min: 2, max: 20 }, password: { type: 'string', min: 6, max: 20 } }
    if (body.username != null && typeof body.username !== 'string') {
      throw new ValidateException('username should be a string');
    }
    if (body.password != null && typeof body.password !== 'string') {
      throw new ValidateException('password should be a string');
    }
    if (body.username && (body.username.length < 2 || body.username.length > 20)) {
      throw new ValidateException('username should be between 2 and 20 characters');
    }
    if (body.password && (body.password.length < 6 || body.password.length > 20)) {
      throw new ValidateException('password should be between 6 and 20 characters');
    }

    const sysAdmin = await this.adminModel.findOne({
      where: { username: body.username },
    });
    if (!sysAdmin) {
      throw new BusinessException('没有找到该用户', 330);
    }
    // 注意：模型中属性为 isDelete / isDisable（原实现误用 snake_case 判断，导致永远不成立）
    if (sysAdmin.isDelete === 1) {
      throw new BusinessException('该账户已被删除', 330);
    }
    if (sysAdmin.isDisable === 1) {
      throw new BusinessException('该账户已被禁用', 331);
    }
    const md5Pwd = md5(body.password + sysAdmin.salt);
    if (sysAdmin.password !== md5Pwd) {
      throw new BusinessException('密码错误', 330);
    }

    const token = setToken({ password: body.password, username: body.username });
    const adminIdStr = String(sysAdmin.id);

    // 非多次登录
    if (sysAdmin.isMultipoint === 0) {
      const sysAdminSetKey = backstageTokenSet + adminIdStr;
      const ts = await this.redis.sGet(sysAdminSetKey);
      if (ts.length > 0) {
        const keys: string[] = [];
        for (const t of ts) {
          keys.push(backstageTokenKey + t);
        }
        await this.redis.del(keys);
      }
      await this.redis.del(sysAdminSetKey);
      await this.redis.sSet(sysAdminSetKey, token);
    }

    // 缓存登录信息
    await this.redis.set(backstageTokenKey + token, adminIdStr, 7200);
    await this.authAdmin.cacheAdminUserByUid(sysAdmin.id);

    // 更新登录信息
    const dateTime = Math.floor(Date.now() / 1000);
    await this.adminModel.update(
      {
        lastLoginIp: getRequestContext()?.ip,
        lastLoginTime: dateTime,
        updateTime: dateTime,
      } as any,
      { where: { id: sysAdmin.id } },
    );

    // 记录登录日志
    const resultLog = await this.authAdmin.recordLoginLog(sysAdmin.id, body.username, '');
    if (!resultLog) {
      throw new BusinessException('请求错误', 330);
    }

    return ok({ token });
  }

  @Get('system/menu/route')
  async menusRoute(): Promise<ApiResult> {
    const roleId: any = getRequestContext()?.session?.[reqRoleIdKey];
    const data = await this.authAdmin.selectMenuByRoleId(roleId);
    return ok(data);
  }

  @Get('common/index/console')
  async console(): Promise<ApiResult> {
    const data = await this.common.getConsole();
    return ok(data);
  }

  @Get('common/index/config')
  async configInfo(): Promise<ApiResult> {
    const data = await this.common.getConfig();
    return ok(data);
  }

  @Post('system/logout')
  async logout(): Promise<ApiResult> {
    const token = getRequestContext()?.token;
    await this.redis.del(backstageTokenKey + token);
    return ok('');
  }
}
