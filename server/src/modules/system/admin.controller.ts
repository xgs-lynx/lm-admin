import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import config from '../../common/config';
import { ok, ApiResult } from '../../common/result';
import { getRequestContext } from '../../common/request-context';
import urlUtil from '../../common/utils/url.util';
import { BusinessException } from '../../common/exceptions/business.exception';
import { SystemAuthAdmin } from '../../models/system-auth-admin.model';
import { SystemAuthMenu } from '../../models/system-auth-menu.model';
import { AuthAdminService } from './services/auth-admin.service';

const { reqAdminIdKey } = config;

@Controller('api/system/admin')
export class SystemAdminController {
  constructor(
    @InjectModel(SystemAuthAdmin) private readonly adminModel: typeof SystemAuthAdmin,
    @InjectModel(SystemAuthMenu) private readonly menuModel: typeof SystemAuthMenu,
    private readonly authAdmin: AuthAdminService,
  ) {}

  @Get('list')
  async adminList(@Query() params: any): Promise<ApiResult> {
    const data = await this.authAdmin.adminList(params);
    return ok(data);
  }

  @Get('self')
  async self(): Promise<ApiResult> {
    const adminId: any = getRequestContext()?.session?.[reqAdminIdKey];

    const sysAdmin = await this.adminModel.findOne({
      where: { id: adminId, isDelete: 0 },
      attributes: [
        'id',
        'nickname',
        'nickname',
        'avatar',
        'role',
        'deptId',
        'isMultipoint',
        'isDisable',
        'lastLoginIp',
        'lastLoginTime',
        'createTime',
        'updateTime',
      ],
    });

    if (!sysAdmin) {
      throw new BusinessException('账号不存在了!');
    }

    let auths: string[] = [];
    if (Number(adminId) > 1) {
      const roleId = parseInt(sysAdmin.role, 10);
      const menuIds = await this.authAdmin.selectMenuIdsByRoleId(roleId);

      if (menuIds.length > 0) {
        const menus = await this.menuModel.findAll({
          where: {
            id: { [Op.in]: menuIds },
            isDisable: 0,
            menuType: ['C', 'A'],
          },
          order: [
            ['menuSort', 'ASC'],
            ['id', 'ASC'],
          ],
        });

        if (menus.length > 0) {
          auths = menus.map(menu => menu.perms.trim());
        }
      }
    } else {
      auths = ['*'];
    }

    const admin = {
      user: {
        ...sysAdmin.toJSON(),
        dept: String(sysAdmin.deptId),
        avatar: urlUtil.toAbsoluteUrl(sysAdmin.avatar),
      },
      permissions: auths,
    };

    return ok(admin);
  }

  @Get('detail')
  async detail(@Query('id') id: number): Promise<ApiResult> {
    const data = await this.authAdmin.detail(id);
    return ok(data);
  }

  @Post('add')
  async add(@Body() addReq: any): Promise<ApiResult> {
    await this.authAdmin.add(addReq);
    return ok({});
  }

  @Post('edit')
  async edit(@Body() editReq: any): Promise<ApiResult> {
    await this.authAdmin.edit(editReq);
    return ok({});
  }

  @Post('upInfo')
  async update(@Body() editReq: any): Promise<ApiResult> {
    await this.authAdmin.update(editReq);
    return ok({});
  }

  @Post('del')
  async del(@Body('id') id: number): Promise<ApiResult> {
    await this.authAdmin.del(id);
    return ok({});
  }

  @Post('disable')
  async disable(@Body('id') id: number): Promise<ApiResult> {
    await this.authAdmin.disable(id);
    return ok({});
  }
}
