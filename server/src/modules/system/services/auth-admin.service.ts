import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import md5 from 'md5';
import parser from 'ua-parser-js';
import config from '../../../common/config';
import * as util from '../../../common/utils';
import urlUtil from '../../../common/utils/url.util';
import { RedisService } from '../../../redis/redis.service';
import { getRequestContext } from '../../../common/request-context';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { SystemAuthAdmin } from '../../../models/system-auth-admin.model';
import { SystemAuthRole } from '../../../models/system-auth-role.model';
import { SystemAuthMenu } from '../../../models/system-auth-menu.model';
import { SystemAuthPerm } from '../../../models/system-auth-perm.model';
import { SystemAuthDept } from '../../../models/system-auth-dept.model';
import { SystemLogLogin } from '../../../models/system-log-login.model';

const {
  backstageManageKey,
  backstageRolesKey,
  reqAdminIdKey,
  superAdminId,
  backstageTokenKey,
  backstageTokenSet,
} = config;

@Injectable()
export class AuthAdminService {
  constructor(
    private readonly redis: RedisService,
    @InjectModel(SystemAuthAdmin) private readonly adminModel: typeof SystemAuthAdmin,
    @InjectModel(SystemAuthRole) private readonly roleModel: typeof SystemAuthRole,
    @InjectModel(SystemAuthMenu) private readonly menuModel: typeof SystemAuthMenu,
    @InjectModel(SystemAuthPerm) private readonly permModel: typeof SystemAuthPerm,
    @InjectModel(SystemAuthDept) private readonly deptModel: typeof SystemAuthDept,
    @InjectModel(SystemLogLogin) private readonly logLoginModel: typeof SystemLogLogin,
  ) {}

  async cacheAdminUserByUid(id: number) {
    const admin = await this.adminModel.findOne({ where: { id } });
    if (!admin) {
      return;
    }
    const str = JSON.stringify(admin);
    if (!str) {
      return;
    }
    await this.redis.hSet(backstageManageKey, parseInt(String(admin.id), 10) as any, str, 0);
  }

  async cacheRoleMenusByRoleId(roleId: any) {
    try {
      const perms = await this.permModel.findAll({ where: { roleId } });

      const menuIds = perms.map(perm => perm.menuId);

      const menus = await this.menuModel.findAll({
        where: {
          isDisable: 0,
          id: { [Op.in]: menuIds },
          menuType: { [Op.in]: ['C', 'A'] },
        },
        order: [
          ['menuSort', 'ASC'],
          ['id', 'ASC'],
        ],
      });

      const menuArray = menus.filter(menu => menu.perms !== '').map(menu => menu.perms.trim());

      const redisKey = backstageRolesKey;
      const roleIdStr = String(roleId);
      const menuString = menuArray.join(',');

      await this.redis.hSet(redisKey, roleIdStr, menuString, 0);

      return menuArray;
    } catch (err) {
      throw new Error('CacheRoleMenusByRoleId error:' + err);
    }
  }

  // SelectMenuIdsByRoleId 根据角色ID获取菜单ID
  async selectMenuIdsByRoleId(roleId: number): Promise<number[]> {
    try {
      const role = await this.roleModel.findOne({ where: { id: roleId, isDisable: 0 } });
      if (!role) {
        return [];
      }

      const perms = await this.permModel.findAll({ where: { roleId: role.id } });

      const menuIds = perms.map(perm => perm.menuId);
      return menuIds;
    } catch (err) {
      throw new Error('SelectMenuIdsByRoleId error:' + err);
    }
  }

  // SelectMenuByRoleId 根据角色ID获取菜单
  async selectMenuByRoleId(roleId: number) {
    const ctx = getRequestContext();
    const adminId = ctx?.session?.[reqAdminIdKey];
    let menuIds = await this.selectMenuIdsByRoleId(roleId);
    if (!menuIds || menuIds.length === 0) {
      menuIds = [0];
    }

    const where: any = {
      menuType: ['M', 'C'],
      isDisable: 0,
    };
    if (adminId !== superAdminId) {
      where.id = menuIds;
    }

    const menus = await this.menuModel.findAll({
      where,
      order: [
        ['menuSort', 'DESC'],
        ['id', 'ASC'],
      ],
    });

    const menuResps = menus.map(menu => menu.toJSON());
    const mapList = util.listToTree(util.structsToMaps(menuResps as any), 'id', 'pid', 'children');
    return mapList;
  }

  // BatchSaveByMenuIds 批量写入角色菜单
  async batchSaveByMenuIds(roleId: number, menuIds: string, transaction?: any) {
    if (!menuIds) {
      return;
    }

    const menuIdArray = String(menuIds).split(',');

    const perms = menuIdArray.map(menuIdStr => ({
      id: util.makeUuid(),
      roleId,
      menuId: parseInt(menuIdStr, 10),
    }));

    try {
      await this.permModel.bulkCreate(perms, { transaction });
    } catch (err) {
      throw new Error('BatchSaveByMenuIds Create in tx err');
    }
  }

  // BatchDeleteByRoleId 批量删除角色菜单(根据角色ID)
  async batchDeleteByRoleId(roleId: number, transaction?: any) {
    const options: any = { where: { roleId } };

    if (transaction) {
      options.transaction = transaction;
    }

    try {
      await this.permModel.destroy(options);
    } catch (err) {
      throw new Error('BatchDeleteByRoleId Delete err');
    }
  }

  async recordLoginLog(adminId: number, username: string, errStr?: string) {
    const ctx = getRequestContext();
    const ua = parser(ctx?.userAgent || '');
    let status = 0;
    if (!errStr) {
      status = 1;
    }
    try {
      const params = {
        adminId,
        username,
        ip: ctx?.ip || '',
        os: JSON.stringify(ua.os),
        browser: JSON.stringify(ua.browser),
        status,
      };
      const result = await this.logLoginModel.create({ ...params } as any);
      return result;
    } catch (err) {
      throw new Error(err as any);
    }
  }

  async adminList(listReq: any) {
    try {
      const limit = parseInt(listReq.pageSize, 10);
      const offset = listReq.pageSize * (listReq.pageNo - 1);

      const username = listReq.username || '';
      const nickname = listReq.nickname || '';

      const where: any = {};
      if (listReq.role) {
        where.role = listReq.role;
      }

      const adminModel = await this.adminModel.findAndCountAll({
        where: {
          isDelete: 0,
          username: { [Op.like]: `%${username}%` },
          nickname: { [Op.like]: `%${nickname}%` },
          ...where,
        },
        include: [{ model: SystemAuthDept, as: 'dept', attributes: ['name'] }],
        limit,
        offset,
        order: [
          ['id', 'DESC'],
          ['sort', 'DESC'],
        ],
        attributes: { exclude: ['password', 'salt', 'deleteTime', 'isDelete', 'sort'] },
      });

      const adminResp: any[] = adminModel.rows.map(admin => admin.toJSON());
      const count = adminModel.count;

      for (let i = 0; i < adminResp.length; i++) {
        adminResp[i].avatar = urlUtil.toAbsoluteUrl(adminResp[i].avatar);
        adminResp[i].dept = adminResp[i].dept ? adminResp[i].dept.name : '';
        if (adminResp[i].id === 1) {
          adminResp[i].role = '系统管理员';
          delete adminResp[i].authRole;
        } else {
          const roleIds = String(adminResp[i].role).split(',');
          const role = await this.roleModel.findAll({
            where: { id: roleIds as any },
            attributes: ['name'],
          });
          const rows = role.map(items => items.name);
          adminResp[i].role = rows;
        }
      }

      return {
        pageNo: listReq.pageNo,
        pageSize: listReq.pageSize,
        count,
        lists: adminResp,
      };
    } catch (err) {
      throw new BusinessException('List Find err');
    }
  }

  async detail(id: number) {
    try {
      const sysAdmin = await this.adminModel.findOne({
        where: { id, isDelete: 0 },
        attributes: { exclude: ['password', 'salt', 'deleteTime', 'isDelete', 'sort'] },
      });

      if (!sysAdmin) {
        throw new Error('账号已不存在！');
      }

      const res: any = sysAdmin.toJSON();

      res.avatar = urlUtil.toAbsoluteUrl(res.avatar);

      if (!res.dept) {
        res.dept = String(res.deptId);
      }

      return res;
    } catch (err) {
      throw new BusinessException('Get Admin Detail error');
    }
  }

  async add(addReq: any) {
    delete addReq.id;

    try {
      let sysAdmin = await this.adminModel.findOne({
        where: { username: addReq.username, isDelete: 0 },
      });

      if (sysAdmin) {
        throw new BusinessException('账号已存在换一个吧！');
      }

      sysAdmin = await this.adminModel.findOne({
        where: { nickname: addReq.nickname, isDelete: 0 },
      });

      if (sysAdmin) {
        throw new BusinessException('昵称已存在换一个吧！');
      }

      const roles = addReq.role; // 角色数组

      const roleResps = await this.roleModel.findAll({
        where: { id: roles, isDisable: 0 },
      });

      if (roleResps.length === 0) {
        throw new BusinessException('当前角色已被禁用!');
      }

      const passwdLen = addReq.password.length;

      if (!(passwdLen >= 6 && passwdLen <= 20)) {
        throw new BusinessException('密码必须在6~20位');
      }

      const salt = util.randomString(5);

      const dateTime = Math.floor(Date.now() / 1000);
      const timeObject = {
        createTime: dateTime,
        updateTime: dateTime,
      };

      const data: any = { ...addReq, ...timeObject };

      data.role = String(addReq.role);
      data.salt = salt;
      data.password = md5(addReq.password.trim() + salt);

      if (!addReq.avatar) {
        data.avatar = '/public/static/backend_avatar.png';
      } else {
        data.avatar = urlUtil.toRelativeUrl(addReq.avatar);
      }

      await this.adminModel.create(data);

      return;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Add Admin error');
    }
  }

  async edit(editReq: any) {
    try {
      const admin = await this.adminModel.findByPk(editReq.id);

      if (!admin || admin.isDelete) {
        throw new BusinessException('账号不存在了!');
      }

      let sysAdmin = await this.adminModel.findOne({
        where: {
          username: editReq.username,
          isDelete: 0,
          id: { [Op.ne]: editReq.id },
        },
      });

      if (sysAdmin) {
        throw new BusinessException('账号已存在换一个吧！');
      }

      sysAdmin = await this.adminModel.findOne({
        where: {
          nickname: editReq.nickname,
          isDelete: 0,
          id: { [Op.ne]: editReq.id },
        },
      });

      if (sysAdmin) {
        throw new BusinessException('昵称已存在换一个吧！');
      }

      if (editReq.role > 0 && editReq.id !== 1) {
        const roleResps = await this.roleModel.findAll({
          where: { id: editReq.role },
        });

        if (roleResps.length === 0) {
          throw new BusinessException('角色不存在!');
        }
      }

      const adminMap: any = { ...editReq };

      if (!editReq.avatar) {
        adminMap.avatar = '/public/static/backend_avatar.png';
      } else {
        adminMap.avatar = urlUtil.toRelativeUrl(editReq.avatar);
      }

      const role = editReq.role > 0 && editReq.id !== 1 ? editReq.role : 0;

      adminMap.role = String(role);

      if (Number(editReq.id) === 1) {
        delete adminMap.username;
      }

      if (editReq.password) {
        const passwdLen = editReq.password.length;

        if (!(passwdLen >= 6 && passwdLen <= 20)) {
          throw new BusinessException('密码必须在6~20位');
        }

        const salt = util.randomString(5);

        adminMap.salt = salt;
        adminMap.password = md5(editReq.password.trim() + salt);
      } else {
        delete adminMap.password;
      }

      await admin.update(adminMap);

      this.cacheAdminUserByUid(editReq.id);

      const ctx = getRequestContext();
      const adminId = ctx?.session?.[reqAdminIdKey];

      if (editReq.password && Number(editReq.id) === adminId) {
        const token = ctx?.token;

        await this.redis.del(backstageTokenKey + token);

        const adminSetKey = backstageTokenSet + String(adminId);

        const ts = await this.redis.client.smembers(adminSetKey);

        if (ts.length > 0) {
          const tokenKeys = ts.map(t => backstageTokenKey + t);

          await this.redis.del(tokenKeys);
        }

        await this.redis.del(adminSetKey);

        await this.redis.client.sadd(adminSetKey, token);
      }

      return;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Edit Admin error');
    }
  }

  async update(updateReq: any) {
    const ctx = getRequestContext();
    const adminId = ctx?.session?.[reqAdminIdKey];
    // 检查id
    const admin = await this.adminModel.findOne({
      where: { id: adminId, isDelete: 0 },
    });
    if (!admin) {
      throw new BusinessException('账号不存在了!');
    }

    // 更新管理员信息
    const adminMap: any = { ...updateReq };
    delete adminMap.currPassword;

    if (!updateReq.avatar) {
      adminMap.avatar = '/public/static/backend_avatar.png';
    } else {
      adminMap.avatar = urlUtil.toRelativeUrl(updateReq.avatar);
    }

    if (updateReq.password) {
      const currPass = md5(updateReq.currPassword + admin.salt);
      if (currPass !== admin.password) {
        throw new BusinessException('当前密码不正确!');
      }
      const passwdLen = updateReq.password.length;
      if (!(passwdLen >= 6 && passwdLen <= 20)) {
        throw new BusinessException('密码必须在6~20位');
      }
      const salt = util.randomString(5);
      adminMap.salt = salt;
      adminMap.password = md5(updateReq.password.trim() + salt);
    } else {
      delete adminMap.password;
    }

    try {
      await this.adminModel.update(adminMap, { where: { id: adminId } });
    } catch (err) {
      throw new BusinessException('更新管理员信息失败');
    }

    this.cacheAdminUserByUid(adminId);

    // 如果更改自己的密码,则删除旧缓存
    if (updateReq.password) {
      const token = ctx?.token;
      await this.redis.del(backstageTokenKey + token);
      const adminSetKey = backstageTokenSet + adminId.toString();
      const ts = await this.redis.sGet(adminSetKey);
      if (ts.length > 0) {
        const tokenKeys = ts.map(t => backstageTokenKey + t);
        await this.redis.del(tokenKeys);
      }
      await this.redis.del(adminSetKey);
      await this.redis.sSet(adminSetKey, token);
    }
  }

  async del(id: number) {
    const ctx = getRequestContext();
    const adminId = ctx?.session?.[reqAdminIdKey];

    const admin = await this.adminModel.findOne({ where: { id, isDelete: 0 } });

    if (!admin) {
      throw new BusinessException('账号已不存在!');
    }

    if (Number(id) === 1) {
      throw new BusinessException('系统管理员不允许删除!');
    }

    if (Number(id) === adminId) {
      throw new BusinessException('不能删除自己!');
    }

    await admin.update({
      isDelete: 1,
      deleteTime: Math.floor(Date.now() / 1000),
    } as any);

    // 同步刷新登录缓存，否则中间件的“用户被删除”校验读到的是旧值
    await this.cacheAdminUserByUid(id);

    return null;
  }

  async disable(id: number) {
    const ctx = getRequestContext();
    const adminId = ctx?.session?.[reqAdminIdKey];

    const admin = await this.adminModel.findOne({ where: { id, isDelete: 0 } });

    if (!admin) {
      throw new BusinessException('账号已不存在！');
    }

    if (Number(id) === adminId) {
      throw new BusinessException('不能禁用自己!');
    }

    const isDisable = admin.isDisable === 0 ? 1 : 0;

    await admin.update({
      isDisable,
      updateTime: Math.floor(Date.now() / 1000),
    } as any);

    // 同步刷新登录缓存，否则中间件的“账号已被禁用”校验读到的是旧值
    await this.cacheAdminUserByUid(id);

    return null;
  }
}
