import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import moment from 'moment';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { SystemLogOperate } from '../../../models/system-log-operate.model';
import { SystemLogLogin } from '../../../models/system-log-login.model';
import { SystemAuthAdmin } from '../../../models/system-auth-admin.model';

/**
 * 登录日志的 os / browser 列存的是 ua-parser-js 结果的 JSON.stringify
 *（见 AuthAdminService.recordLoginLog），形如 {"name":"Mac OS","version":"10.15.7"}。
 * 这里解析成 "Mac OS 10.15.7"；解析失败（历史脏数据或人工写入的纯文本）原样返回，不抛错。
 */
function formatUa(raw: any): string {
  if (!raw) return '';
  if (typeof raw !== 'string') return String(raw);
  try {
    const ua = JSON.parse(raw);
    if (!ua || typeof ua !== 'object') return raw;
    return [ua.name, ua.version].filter(Boolean).join(' ');
  } catch {
    return raw;
  }
}

/**
 * 前端 daterange-picker 传的是 YYYY-MM-DD 字符串，而 create_time 是 int 秒。
 * 若把字符串直接塞进比较条件，MySQL 会把它隐式转成数字（'2026-01-01' -> 2026）再与
 * 时间戳比较，导致任何日期筛选都返回全表且不报错。此处严格解析成秒级区间。
 * 用 moment 而非 new Date()：后者按 UTC 解析 YYYY-MM-DD，会差 8 小时。
 */
function toUnixRange(startTime: any, endTime: any): [number, number] | null {
  const start = moment(String(startTime), 'YYYY-MM-DD', true);
  const end = moment(String(endTime), 'YYYY-MM-DD', true);
  if (!start.isValid() || !end.isValid()) return null;
  return [start.startOf('day').unix(), end.endOf('day').unix()];
}

@Injectable()
export class LogService {
  constructor(
    @InjectModel(SystemLogOperate) private readonly logModel: typeof SystemLogOperate,
    @InjectModel(SystemLogLogin) private readonly logLoginModel: typeof SystemLogLogin,
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

  async login(listReq: any) {
    try {
      const pageNo = parseInt(listReq.pageNo, 10) || 1;
      const pageSize = parseInt(listReq.pageSize, 10) || 15;
      const offset = pageSize * (pageNo - 1);

      // username 是登录时冗余写入本表的列，直接按本表字段匹配即可，无需关联 admin 表
      const where: any = {
        ...(listReq.username && { username: { [Op.like]: `%${listReq.username}%` } }),
        ...(listReq.ip && { ip: { [Op.like]: `%${listReq.ip}%` } }),
      };

      // status 实际只写入 1=成功 / 0=失败（模型与 DDL 注释里的 2=失败是错的，从不出现）。
      // 不能写成 `listReq.status &&` —— 0 是合法取值，真值判断会让「失败」筛选静默失效返回全表。
      if (listReq.status !== undefined && listReq.status !== null && listReq.status !== '') {
        where.status = parseInt(listReq.status, 10);
      }

      const range = toUnixRange(listReq.startTime, listReq.endTime);
      if (range) {
        where.createTime = { [Op.gte]: range[0], [Op.lte]: range[1] };
      }

      const { count, rows } = await this.logLoginModel.findAndCountAll({
        where,
        limit: pageSize,
        offset,
        order: [['id', 'DESC']],
      });

      const data = {
        pageNo,
        pageSize,
        count,
        lists: rows.map((row) => {
          const item: any = row.toJSON();
          return {
            ...item,
            os: formatUa(item.os),
            browser: formatUa(item.browser),
            // 该模型没有像其他模型那样给 createTime 加 get() 格式化，这里补齐，
            // 使前端与其他列表页一致，直接 prop="createTime" 即可
            createTime: item.createTime
              ? moment(item.createTime * 1000).format('YYYY-MM-DD HH:mm:ss')
              : '',
          };
        }),
      };
      return data;
    } catch (err) {
      throw new BusinessException(`SystemLogController.login error: ${err}`);
    }
  }
}
