/**
 * Token 认证 + 角色权限校验中间件。
 */
import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { RedisService } from '../../redis/redis.service';
import { AuthAdminService } from '../../modules/system/services/auth-admin.service';
import { requestContextStorage, RequestContext } from '../request-context';

const {
  notLoginUri,
  notAuthUri,
  backstageTokenKey,
  backstageManageKey,
  backstageRolesKey,
  reqAdminIdKey,
  reqRoleIdKey,
  reqUsernameKey,
  reqNicknameKey,
  superAdminId,
  clientUriPrefix,
} = config;

function reject(code: number, message: string) {
  throw new HttpException({ code, data: '', message, msg: message }, HttpStatus.FORBIDDEN);
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly redis: RedisService,
    private readonly authAdmin: AuthAdminService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ctx = new RequestContext();
    ctx.token = req.headers['token'] as string;
    ctx.ip = req.ip || (req.socket && req.socket.remoteAddress) || '';
    ctx.userAgent = (req.headers['user-agent'] as string) || '';

    await requestContextStorage.run(ctx, async () => {
      await this.handle(req);
      next();
    });
  }

  private async handle(req: Request) {
    // 只拦截 /api 接口，静态资源等直接放行
    const pathname = String(req.originalUrl || req.url || '').split('?')[0];
    if (!pathname.startsWith('/api/')) {
      return;
    }

    // C 端接口（/api/client/*）由 ClientAuthMiddleware 独立鉴权。
    // 必须放在下面转权限串之前：否则 /api/client/user/login 会被转成 client:user:login，
    // 先撞 backstage:token 校验（必然 332/333）。提前 return 还能省掉本中间件后续
    // 每请求一次的 cacheRoleMenusByRoleId（两次 DB 查询）。
    if (pathname.startsWith(clientUriPrefix)) {
      return;
    }

    const auths = pathname.replace('/api/', '').split('/').join(':');

    // 免登录接口
    if (notLoginUri.includes(auths)) {
      return;
    }

    // Token是否为空
    const token = req.headers['token'] as string;
    if (!token) {
      reject(332, 'token参数为空');
      return;
    }

    // Token是否过期
    const tokenKey = backstageTokenKey + token;
    const exist = await this.redis.exists(tokenKey);
    if (exist < 0) {
      reject(500, '系统错误');
      return;
    } else if (exist === 0) {
      reject(333, 'token参数无效');
      return;
    }

    // 用户信息缓存
    const uidStr = await this.redis.get(tokenKey);
    const uid = uidStr === '' ? 0 : parseInt(uidStr, 10);
    if (isNaN(uid)) {
      reject(333, 'token参数无效');
      return;
    }

    const hexist = await this.redis.hExists(backstageManageKey, uidStr);
    if (!hexist) {
      await this.authAdmin.cacheAdminUserByUid(uid);
    }

    // 校验用户被删除
    // 注意：缓存里是 Sequelize 实例的 JSON，键为模型的 camelCase 属性名
    //（isDelete / isDisable），原实现按 snake_case 取值，导致这两处校验从未生效。
    const userInfoRaw = await this.redis.hGet(backstageManageKey, uidStr);
    const userInfo = JSON.parse(userInfoRaw);
    const isDelete = userInfo.isDelete ?? userInfo.is_delete;
    const isDisable = userInfo.isDisable ?? userInfo.is_disable;

    if (isDelete === 1) {
      await this.redis.del(tokenKey);
      await this.redis.hDel(backstageManageKey, uidStr);
      reject(333, '用户被删除');
      return;
    }

    // 校验用户被禁用
    if (isDisable === 1) {
      reject(331, '登录账号已被禁用了');
      return;
    }

    // 令牌剩余30分钟自动续签
    const ttl = await this.redis.ttl(tokenKey);
    if (ttl < 1800) {
      await this.redis.expire(tokenKey, 7200);
    }

    // 单次请求信息保存
    const ctx = requestContextStorage.getStore();
    if (ctx) {
      ctx.session[reqAdminIdKey] = uid;
      ctx.session[reqRoleIdKey] = userInfo.role;
      ctx.session[reqUsernameKey] = userInfo.username;
      ctx.session[reqNicknameKey] = userInfo.nickname;
    }

    // 免权限验证接口
    if (notAuthUri.includes(auths) || uid === superAdminId) {
      return;
    }

    // 缓存角色菜单。
    // 说明：原实现写作 `const hExists = ctx.service.redis.hExists(...)`（漏写 await，
    // Promise 恒为真），因此每次请求都会刷新角色菜单缓存。该行为是必要的：
    // authRole.edit 是在事务内调用 cacheRoleMenusByRoleId，读到的是未提交的旧数据，
    // 必须靠后续请求的再次刷新来完成最终一致。这里显式保留这一行为。
    const roleId = userInfo.role;
    const roleMenu = await this.authAdmin.cacheRoleMenusByRoleId(roleId);
    if (!roleMenu) {
      reject(500, '系统错误');
      return;
    }

    // 验证是否有权限操作
    const menus = await this.redis.hGet(backstageRolesKey, roleId);
    const menusArray = String(menus).split(',');
    if (!(menus !== '' && menusArray.includes(auths))) {
      reject(403, '无相关权限');
      return;
    }
  }
}
