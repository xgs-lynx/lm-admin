import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, literal } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import config from '../../../common/config';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { RedisService } from '../../../redis/redis.service';
import { SystemAuthRole } from '../../../models/system-auth-role.model';
import { SystemAuthAdmin } from '../../../models/system-auth-admin.model';
import { AuthAdminService } from './auth-admin.service';

const { backstageRolesKey } = config;

@Injectable()
export class AuthRoleService {
  constructor(
    @InjectModel(SystemAuthRole) private readonly roleModel: typeof SystemAuthRole,
    @InjectModel(SystemAuthAdmin) private readonly adminModel: typeof SystemAuthAdmin,
    private readonly sequelize: Sequelize,
    private readonly redis: RedisService,
    private readonly authAdmin: AuthAdminService,
  ) {}

  async all() {
    try {
      const roles = await this.roleModel.findAll({
        order: [
          ['sort', 'DESC'],
          ['id', 'DESC'],
        ],
      });

      return roles.map(role => role.toJSON());
    } catch (err) {
      throw new BusinessException(`AuthRoleService.all error: ${err}`);
    }
  }

  async list(page: any) {
    try {
      const limit = parseInt(page.pageSize, 10);
      const offset = page.pageSize * (page.pageNo - 1);

      const roleModel = await this.roleModel.findAndCountAll({
        limit,
        offset,
        order: [
          ['sort', 'DESC'],
          ['id', 'DESC'],
        ],
      });

      const roles: any[] = roleModel.rows.map(role => role.toJSON());
      const count = roleModel.count;

      const roleResp = await Promise.all(
        roles.map(async role => {
          const { id, name, sort, isDisable, createTime, updateTime, remark } = role;
          const member = await this.getMemberCnt(role.id);

          return {
            id,
            name,
            sort,
            isDisable,
            createTime,
            updateTime,
            remark,
            menus: [],
            member,
          };
        }),
      );

      return {
        pageNo: page.pageNo,
        pageSize: page.pageSize,
        count,
        lists: roleResp,
      };
    } catch (err) {
      throw new BusinessException('List Find err');
    }
  }

  // getMemberCnt 根据角色ID获取成员数量
  async getMemberCnt(roleId: number) {
    try {
      const count = await this.adminModel.count({
        where: {
          role: {
            [Op.and]: [literal(`FIND_IN_SET('${roleId}', role) > 0`)],
          },
          isDelete: 0,
        } as any,
      });

      return count;
    } catch (err) {
      throw new BusinessException('Get Member Count error');
    }
  }

  async detail(id: number) {
    const role = await this.roleModel.findOne({ where: { id } });

    if (!role) {
      throw new BusinessException('角色已不存在!');
    }

    const res: any = role.toJSON();

    const member = await this.getMemberCnt(role.id);
    const menus = await this.authAdmin.selectMenuIdsByRoleId(role.id);

    return {
      ...res,
      member,
      menus,
    };
  }

  async add(addReq: any) {
    delete addReq.id;
    const dateTime = Math.floor(Date.now() / 1000);
    const timeObject = {
      createTime: dateTime,
      updateTime: dateTime,
    };

    const existingRole = await this.roleModel.findOne({
      where: { name: addReq.name.trim() },
    });

    if (existingRole) {
      throw new BusinessException('角色名称已存在!');
    }

    const role = {
      ...addReq,
      ...timeObject,
    };

    const transaction = await this.sequelize.transaction();

    try {
      const createdRole = await this.roleModel.create(role, { transaction });

      await this.authAdmin.batchSaveByMenuIds(createdRole.id, addReq.menuIds, transaction);

      await transaction.commit();
    } catch (err) {
      if (!(transaction as any).finished) {
        await transaction.rollback();
      }
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(String(err));
    }
  }

  async edit(editReq: any) {
    const existingRole = await this.roleModel.findOne({ where: { id: editReq.id } });

    if (!existingRole) {
      throw new BusinessException('角色已不存在!');
    }

    const role = await this.roleModel.findOne({
      where: {
        id: { [Op.ne]: editReq.id },
        name: editReq.name.trim(),
      },
    });

    if (role) {
      throw new BusinessException('角色名称已存在!');
    }

    const roleMap = { ...editReq };

    const transaction = await this.sequelize.transaction();

    try {
      await existingRole.update(roleMap, { transaction });

      await this.authAdmin.batchDeleteByRoleId(editReq.id, transaction);
      await this.authAdmin.batchSaveByMenuIds(editReq.id, editReq.menuIds, transaction);
      await this.authAdmin.cacheRoleMenusByRoleId(editReq.id);

      await transaction.commit();
    } catch (err) {
      if (!(transaction as any).finished) {
        await transaction.rollback();
      }
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(String(err));
    }
  }

  async del(id: number) {
    const existingRole = await this.roleModel.findOne({ where: { id } });

    if (!existingRole) {
      throw new BusinessException('角色已不存在!');
    }
    const admin = await this.adminModel.findOne({
      where: {
        role: {
          [Op.and]: [literal(`FIND_IN_SET('${id}', role) > 0`)],
        },
        isDelete: 0,
      } as any,
    });

    if (admin) {
      throw new BusinessException('角色已被管理员使用,请先移除!');
    }

    const transaction = await this.sequelize.transaction();

    try {
      await existingRole.destroy({ transaction });

      await this.authAdmin.batchDeleteByRoleId(id, transaction);

      await this.redis.hDel(backstageRolesKey, id.toString());

      await transaction.commit();
    } catch (err) {
      if (!(transaction as any).finished) {
        await transaction.rollback();
      }
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(String(err));
    }
  }
}
