import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { DictType } from '../../../models/dict-type.model';
import { DictData } from '../../../models/dict-data.model';

@Injectable()
export class DictService {
  constructor(
    @InjectModel(DictType) private readonly dictTypeModel: typeof DictType,
    @InjectModel(DictData) private readonly dictDataModel: typeof DictData,
  ) {}

  // list 字典类型列表
  async list(listReq: any) {
    try {
      const limit = parseInt(listReq.pageSize, 10);
      const offset = listReq.pageSize * (listReq.pageNo - 1);

      const where: any = {
        isDelete: 0,
        ...(listReq.dictName && { dictName: { [Op.like]: `%${listReq.dictName}%` } }),
        ...(listReq.dictType && { dictType: { [Op.like]: `%${listReq.dictType}%` } }),
        ...(listReq.dictStatus && { dictStatus: listReq.dictStatus }),
      };

      const DictTypeModel = await this.dictTypeModel.findAndCountAll({
        where,
        limit,
        offset,
        order: [['id', 'DESC']],
      });

      const { count, rows } = DictTypeModel;

      return {
        pageNo: listReq.pageNo,
        pageSize: listReq.pageSize,
        count,
        lists: rows,
      };
    } catch (err) {
      throw new BusinessException(`DictService.list error: ${err}`);
    }
  }

  // all 字典类型所有
  async all() {
    try {
      const dictTypes = await this.dictTypeModel.findAll({
        where: { isDelete: 0 },
        order: [['id', 'DESC']],
      });

      return dictTypes;
    } catch (err) {
      throw new BusinessException(`DictService.all error: ${err}`);
    }
  }

  // add 字典类型新增
  async add(addReq: any) {
    delete addReq.id;

    try {
      const existingDictName = await this.dictTypeModel.findOne({
        where: { dictName: addReq.dictName, isDelete: 0 },
      });
      if (existingDictName) {
        throw new BusinessException('字典名称已存在！');
      }

      const existingDictType = await this.dictTypeModel.findOne({
        where: { dictType: addReq.dictType, isDelete: 0 },
      });
      if (existingDictType) {
        throw new BusinessException('字典类型已存在！');
      }

      const dateTime = Math.floor(Date.now() / 1000);
      const timeObject = {
        createTime: dateTime,
        updateTime: dateTime,
      };

      const dt = await this.dictTypeModel.create({ ...addReq, ...timeObject } as any);

      return dt;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(`DictService.add error: ${err}`);
    }
  }

  // detail 字典类型详情
  async detail(id: number) {
    try {
      const dt = await this.dictTypeModel.findOne({ where: { id, isDelete: 0 } });
      if (!dt) {
        throw new BusinessException('字典类型不存在！');
      }
      return dt;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(String(err));
    }
  }

  // edit 字典类型编辑
  async edit(editReq: any) {
    try {
      const existingDictType = await this.dictTypeModel.findOne({
        where: { id: editReq.id, isDelete: 0 },
      });
      if (!existingDictType) {
        throw new BusinessException('字典类型不存在！');
      }

      const duplicateDictName = await this.dictTypeModel.findOne({
        where: { id: { [Op.ne]: editReq.id }, dictName: editReq.dictName, isDelete: 0 },
      });
      if (duplicateDictName) {
        throw new BusinessException('字典名称已存在！');
      }

      const duplicateDictType = await this.dictTypeModel.findOne({
        where: { id: { [Op.ne]: editReq.id }, dictType: editReq.dictType, isDelete: 0 },
      });
      if (duplicateDictType) {
        throw new BusinessException('字典类型已存在！');
      }

      await existingDictType.update(editReq);
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(`DictService.edit error: ${err}`);
    }
  }

  // del 字典类型删除
  async del(delReq: any) {
    try {
      const dateTime = Math.floor(Date.now() / 1000);
      await this.dictTypeModel.update(
        { isDelete: 1, deleteTime: dateTime } as any,
        { where: { id: delReq.ids } as any },
      );
    } catch (err) {
      throw new BusinessException(`DictService.del error: ${err}`);
    }
  }

  // List 字典数据列表
  async dataList(listReq: any) {
    try {
      const limit = parseInt(listReq.pageSize, 10);
      const offset = listReq.pageSize * (listReq.pageNo - 1);

      const dictType = await this.dictTypeModel.findOne({
        where: { dictType: listReq.dictType, isDelete: 0 },
      });

      if (!dictType) {
        throw new BusinessException('该字典类型不存在！');
      }

      const where: any = {
        typeId: dictType.id,
        isDelete: 0,
        ...(listReq.name && { name: { [Op.like]: `%${listReq.name}%` } }),
        ...(listReq.value && { value: { [Op.like]: `%${listReq.value}%` } }),
        ...(listReq.status && { status: listReq.status }),
      };

      const DictDataModel = await this.dictDataModel.findAndCountAll({
        where,
        limit,
        offset,
        order: [['id', 'DESC']],
      });

      const { count, rows } = DictDataModel;

      return {
        pageNo: listReq.pageNo,
        pageSize: listReq.pageSize,
        count,
        lists: rows,
      };
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(`DictService.dataList error: ${err}`);
    }
  }

  // all 字典数据全部
  async dataAll(allReq: any) {
    try {
      const dictType = await this.dictTypeModel.findOne({
        where: { dictType: allReq.dictType, isDelete: 0 },
      });
      if (!dictType) {
        throw new BusinessException('该字典类型不存在！');
      }

      const where: any = { typeId: dictType.id, isDelete: 0 };
      if (allReq.name) {
        where.name = { [Op.like]: `%${allReq.name}%` };
      }
      if (allReq.value) {
        where.value = { [Op.like]: `%${allReq.value}%` };
      }
      if (allReq.status) {
        where.status = allReq.status;
      }

      const dictDatas = await this.dictDataModel.findAll({
        where,
        order: [['id', 'DESC']],
      });

      return dictDatas.map(dictData => dictData.toJSON());
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(`DictService.dataAll error: ${err}`);
    }
  }

  // detail 字典数据详情
  async dataDetail(id: number) {
    try {
      const dictData = await this.dictDataModel.findOne({ where: { id, isDelete: 0 } });
      if (!dictData) {
        throw new BusinessException('字典数据不存在！');
      }

      return dictData;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(`DictService.dataDetail error: ${err}`);
    }
  }

  // add 字典数据新增
  async dataAdd(addReq: any) {
    delete addReq.id;

    try {
      const existingDictData = await this.dictDataModel.findOne({
        where: { name: addReq.name, isDelete: 0 },
      });
      if (existingDictData) {
        throw new BusinessException('字典数据已存在！');
      }

      const newDictData = await this.dictDataModel.create(addReq);
      return newDictData;
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(`DictService.dataAdd error: ${err}`);
    }
  }

  // edit 字典数据编辑
  async dataEdit(editReq: any) {
    try {
      const existingDictData = await this.dictDataModel.findOne({
        where: { id: editReq.id, isDelete: 0 },
      });
      if (!existingDictData) {
        throw new BusinessException('字典数据不存在！');
      }

      const duplicateDictData = await this.dictDataModel.findOne({
        where: { id: { [Op.ne]: editReq.id }, name: editReq.name, isDelete: 0 },
      });
      if (duplicateDictData) {
        throw new BusinessException('字典数据已存在！');
      }

      await existingDictData.update(editReq);
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(`DictService.dataEdit error: ${err}`);
    }
  }

  // del 字典数据删除
  async dataDel(delReq: any) {
    try {
      const dateTime = Math.floor(Date.now() / 1000);
      await this.dictDataModel.update(
        { isDelete: 1, deleteTime: dateTime } as any,
        { where: { id: delReq.ids } as any },
      );
    } catch (err) {
      throw new BusinessException(`DictService.del error: ${err}`);
    }
  }
}
