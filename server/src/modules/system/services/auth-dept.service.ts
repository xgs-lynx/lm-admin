import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as util from '../../../common/utils';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { SystemAuthDept } from '../../../models/system-auth-dept.model';
import { SystemAuthAdmin } from '../../../models/system-auth-admin.model';

@Injectable()
export class AuthDeptService {
  constructor(
    @InjectModel(SystemAuthDept) private readonly deptModel: typeof SystemAuthDept,
    @InjectModel(SystemAuthAdmin) private readonly adminModel: typeof SystemAuthAdmin,
  ) {}

  async list(listReq: any) {
    try {
      const where: any = {
        isDelete: 0,
      };
      for (const paramKey in listReq) {
        if (paramKey === 'isStop' && listReq[paramKey]) {
          where[paramKey] = listReq[paramKey];
        } else {
          where[paramKey] = { [Op.like]: `%${listReq[paramKey]}%` }; // 模糊查找
        }
      }

      const depts = await this.deptModel.findAll({
        where: { ...where },
        order: [
          ['sort', 'DESC'],
          ['id', 'DESC'],
        ],
        attributes: { exclude: ['deleteTime', 'isDelete'] },
      });

      const deptResps = depts.map(dept => dept.toJSON());
      const mapList = util.listToTree(deptResps as any, 'id', 'pid', 'children');

      return mapList;
    } catch (err) {
      throw new BusinessException(`AuthDeptService.list error: ${err}`);
    }
  }

  async add(addReq: any) {
    try {
      if (addReq.pid === 0) {
        const count = await this.deptModel.count({
          where: { pid: 0, isDelete: 0 },
        });

        if (count > 0) {
          throw new BusinessException('顶级部门只允许有一个!');
        }
      }

      const dateTime = Math.floor(Date.now() / 1000);
      const timeObject = {
        createTime: dateTime,
        updateTime: dateTime,
      };

      await this.deptModel.create({ ...timeObject, ...addReq } as any);

      return;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Add Department error');
    }
  }

  async detail(id: number) {
    try {
      const dept = await this.deptModel.findOne({
        where: { id, isDelete: 0 },
        attributes: { exclude: ['deleteTime', 'isDelete'] },
      });

      if (!dept) {
        throw new BusinessException('部门已不存在!');
      }

      return dept.toJSON();
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Get Department Detail error');
    }
  }

  async edit(editReq: any) {
    try {
      const dept = await this.deptModel.findOne({
        where: { id: editReq.id, isDelete: 0 },
      });

      if (!dept) {
        throw new BusinessException('部门不存在!');
      }

      if (dept.pid === 0 && editReq.pid > 0) {
        throw new BusinessException('顶级部门不能修改上级!');
      }

      if (editReq.id === editReq.pid) {
        throw new BusinessException('上级部门不能是自己!');
      }

      Object.assign(dept, editReq);

      await dept.save();

      return;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Edit Department error');
    }
  }

  async del(id: number) {
    try {
      const dept = await this.deptModel.findOne({
        where: { id, isDelete: 0 },
      });

      if (!dept) {
        throw new BusinessException('部门不存在!');
      }

      const childDeptCount = await this.deptModel.count({
        where: { pid: id, isDelete: 0 },
      });

      if (childDeptCount > 0) {
        throw new BusinessException('请先删除子级部门!');
      }

      const adminCount = await this.adminModel.count({
        where: { deptId: id, isDelete: 0 },
      });

      if (adminCount > 0) {
        throw new BusinessException('该部门已被管理员使用，请先移除!');
      }

      dept.isDelete = 1;
      await dept.save();

      return;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException('Delete Department error');
    }
  }

  async all() {
    try {
      const depts = await this.deptModel.findAll({
        where: {
          pid: { [Op.gt]: 0 },
          isDelete: 0,
        },
        order: [
          ['sort', 'DESC'],
          ['id', 'DESC'],
        ],
        attributes: { exclude: ['deleteTime', 'isDelete'] },
      });

      const res = depts.map(dept => dept.toJSON());

      return res;
    } catch (err) {
      throw new BusinessException('Get All Departments error');
    }
  }
}
