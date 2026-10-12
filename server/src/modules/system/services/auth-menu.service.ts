import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import * as util from '../../../common/utils';
import config from '../../../common/config';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { RedisService } from '../../../redis/redis.service';
import { SystemAuthMenu } from '../../../models/system-auth-menu.model';

const { backstageRolesKey } = config;

@Injectable()
export class AuthMenuService {
  constructor(
    @InjectModel(SystemAuthMenu) private readonly menuModel: typeof SystemAuthMenu,
    private readonly sequelize: Sequelize,
    private readonly redis: RedisService,
  ) {}

  async list() {
    try {
      const menus = await this.menuModel.findAll({
        order: [
          ['menuSort', 'DESC'],
          ['id', 'ASC'],
        ],
      });

      const menuResps = menus.map(menu => menu.toJSON());

      const tree = util.listToTree(menuResps as any, 'id', 'pid', 'children');

      return tree;
    } catch (err) {
      throw new BusinessException('list Menu error');
    }
  }

  async detail(id: number) {
    const menu = await this.menuModel.findOne({ where: { id } });

    if (!menu) {
      throw new BusinessException('菜单已不存在!');
    }

    return menu.toJSON();
  }

  async add(addReq: any) {
    delete addReq.id;

    const menu = this.menuModel.build(addReq);

    const transaction = await this.sequelize.transaction();

    try {
      await menu.save({ transaction });

      await transaction.commit();

      await this.redis.del(backstageRolesKey);
    } catch (err) {
      if (!(transaction as any).finished) {
        await transaction.rollback();
      }
      throw new BusinessException('Add Create err');
    }
  }

  async edit(editReq: any) {
    const menu = await this.menuModel.findOne({ where: { id: editReq.id } });

    if (!menu) {
      throw new BusinessException('菜单已不存在!');
    }

    const transaction = await this.sequelize.transaction();

    try {
      Object.assign(menu, editReq);

      await menu.save({ transaction });

      await transaction.commit();

      await this.redis.del(backstageRolesKey);
    } catch (err) {
      if (!(transaction as any).finished) {
        await transaction.rollback();
      }
      throw new BusinessException('Edit Updates err');
    }
  }

  async del(id: number) {
    const menu = await this.menuModel.findOne({ where: { id } });

    if (!menu) {
      throw new BusinessException('菜单已不存在!');
    }

    const transaction = await this.sequelize.transaction();

    try {
      const childMenu = await this.menuModel.findOne({
        where: { pid: id },
        transaction,
      });

      if (childMenu) {
        throw new BusinessException('请先删除子菜单再操作！');
      }

      await menu.destroy({ transaction });

      await transaction.commit();
    } catch (err) {
      if (!(transaction as any).finished) {
        await transaction.rollback();
      }
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Delete Delete err');
    }
  }
}
