import { Injectable } from '@nestjs/common';
import { CommonService } from '../../system/services/common.service';

@Injectable()
export class StorageService {
  constructor(private readonly common: CommonService) {}

  async list() {
    try {
      const engine = 'local';
      const storageList = [
        {
          name: '本地存储',
          alias: 'local',
          describe: '存储在本地服务器',
          status: 0,
        },
      ];
      const mapList = storageList;
      mapList.forEach(item => {
        if (engine === item.alias) {
          item.status = 1;
        }
      });
      return mapList;
    } catch (err) {
      throw new Error(`storageService.config error: ${err}`);
    }
  }

  async detail(alias: string) {
    try {
      const engine = 'local';
      const cnf = await this.common.getMap('storage', alias);
      const status = engine === alias ? 1 : 0;
      return {
        name: (cnf as any).name,
        alias,
        status,
      };
    } catch (err) {
      throw new Error(`storageService.config error: ${err}`);
    }
  }

  async edit(editReq: any) {
    try {
      const engine = 'local';
      if (engine !== editReq.alias) {
        throw new Error(`engine:${editReq.alias} 暂时不支持`);
      }
      const json = JSON.stringify({ name: '本地存储' });
      await this.common.set('storage', editReq.alias, json);

      if (editReq.status === 1) {
        await this.common.set('storage', 'default', editReq.alias);
      } else {
        await this.common.set('storage', 'default', '');
      }
    } catch (err) {
      throw new Error('Edit Set default err');
    }
  }

  async change(alias: string, status: number) {
    try {
      const engine = 'local';
      if (engine !== alias) {
        throw new Error(`engine:${alias} 暂时不支持`);
      }
      if (engine === alias && status === 0) {
        await this.common.set('storage', 'default', '');
      } else {
        await this.common.set('storage', 'default', alias);
      }
    } catch (err) {
      throw new Error('Change Set err');
    }
  }
}
