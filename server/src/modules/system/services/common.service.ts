import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import config from '../../../common/config';
import urlUtil from '../../../common/utils/url.util';
import { SystemConfig } from '../../../models/system-config.model';

const { version, publicUrl } = config;

@Injectable()
export class CommonService {
  constructor(@InjectModel(SystemConfig) private readonly configModel: typeof SystemConfig) {}

  async getConsole() {
    try {
      // 版本信息
      const name = await this.getVal('website', 'name', 'LikeAdmin-Nodejs');
      const versionInfo = {
        name,
        version,
        website: 'www.likeadmin.cn',
        based: 'Vue3.x、ElementUI、MySQL',
        channel: {
          gitee: 'https://gitee.com/likeadmin/likeadmin_python',
          website: 'https://www.likeadmin.cn',
        },
      };

      // 今日数据
      const today = {
        time: '2022-08-11 15:08:29',
        todayVisits: 10,
        totalVisits: 100,
        todaySales: 30,
        totalSales: 65,
        todayOrder: 12,
        totalOrder: 255,
        todayUsers: 120,
        totalUsers: 360,
      };

      // 访客图表
      const now = new Date();
      const date: string[] = [];
      for (let i = 14; i >= 0; i--) {
        const currentDate = new Date(now); // 创建新的 Date 对象保存当前日期
        currentDate.setDate(currentDate.getDate() - i); // 设置日期
        date.push(currentDate.toISOString().split('T')[0]);
      }
      const visitor = {
        date,
        list: [12, 13, 11, 5, 8, 22, 14, 9, 456, 62, 78, 12, 18, 22, 46],
      };

      return {
        version: versionInfo,
        today,
        visitor,
      };
    } catch (err) {
      throw new Error(`IndexService.console error: ${err}`);
    }
  }

  async getConfig() {
    try {
      const website = await this.get('website');
      const copyrightStr = await this.getVal('website', 'copyright', '');
      let copyright: any = [];
      if (copyrightStr) {
        copyright = JSON.parse(copyrightStr);
      }
      return {
        webName: website.name,
        webLogo: urlUtil.toAbsoluteUrl(website.logo),
        webFavicon: urlUtil.toAbsoluteUrl(website.favicon),
        webBackdrop: urlUtil.toAbsoluteUrl(website.backdrop),
        ossDomain: publicUrl,
        copyright,
      };
    } catch (err) {
      throw new Error(`IndexService.config error: ${err}`);
    }
  }

  async getVal(cnfType: string, name: string, defaultVal?: any) {
    try {
      const configMap = await this.get(cnfType, name);
      let data = configMap[name];
      if (!data) {
        data = defaultVal;
      }
      return data;
    } catch (err) {
      throw new Error(`ConfigUtilService.getVal error: ${err}`);
    }
  }

  async getMap(cnfType: string, name: string) {
    try {
      const val = await this.getVal(cnfType, name, '');
      if (val === '') {
        return {};
      }
      const data = JSON.parse(val);
      return data;
    } catch (err) {
      throw new Error(`ConfigUtilService.getMap error: ${err}`);
    }
  }

  async get(cnfType: string, name?: string): Promise<Record<string, string>> {
    try {
      const object: any = {
        type: cnfType,
        ...(name && { name }),
      };
      const configs = await this.configModel.findAll({ where: object });
      const data: Record<string, string> = {};
      for (const item of configs) {
        data[item.name] = item.value;
      }
      return data;
    } catch (err) {
      throw new Error(`ConfigUtilService.get error: ${err}`);
    }
  }

  async set(cnfType: string, name: string, val: any) {
    try {
      let config = await this.configModel.findOne({
        where: { type: cnfType, name },
      });

      if (!config) {
        config = await this.configModel.create({ type: cnfType, name } as any);
      }

      await config.update({ value: val });
    } catch (err) {
      throw new Error('Internal server error');
    }
  }
}
