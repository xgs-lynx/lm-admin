import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { SystemLogOperate } from '../../../models/system-log-operate.model';
import { SystemAuthAdmin } from '../../../models/system-auth-admin.model';

@Injectable()
export class LogService {
  constructor(
    @InjectModel(SystemLogOperate) private readonly logModel: typeof SystemLogOperate,
    @InjectModel(SystemAuthAdmin) private readonly adminModel: typeof SystemAuthAdmin,
  ) {}

  async operate(listReq: any) {
    try {
      const limit = parseInt(listReq.pageSize, 10);
      const offset = listReq.pageSize * (listReq.pageNo - 1);

      const where: any = {
        ...(listReq.title && { title: { [Op.like]: `%${listReq.title}%` } }),
        ...(listReq.ip && { ip: { [Op.like]: `%${listReq.ip}%` } }),
        ...(listReq.type && { type: listReq.type }),
        ...(listReq.status && { status: listReq.status }),
        ...(listReq.url && { url: listReq.url }),
        ...(listReq.startTime &&
          listReq.endTime && {
            createTime: {
              [Op.gte]: listReq.startTime,
              [Op.lte]: listReq.endTime,
            },
          }),
        ...(listReq.username && { '$admin.username$': { [Op.like]: `%${listReq.username}%` } }),
      };

      const logModel = await this.logModel.findAndCountAll({
        where,
        include: [{ model: SystemAuthAdmin, as: 'admin' }],
        limit,
        offset,
        order: [['id', 'DESC']],
      });

      const { count, rows } = logModel;

      const data = {
        pageNo: listReq.pageNo,
        pageSize: listReq.pageSize,
        count,
        lists: rows,
      };
      return data;
    } catch (err) {
      throw new BusinessException(`SystemLogController.operate error: ${err}`);
    }
  }
}
