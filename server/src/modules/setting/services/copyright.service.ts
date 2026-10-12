import { Injectable } from '@nestjs/common';
import { CommonService } from '../../system/services/common.service';

@Injectable()
export class CopyrightService {
  constructor(private readonly common: CommonService) {}

  async details() {
    try {
      const copyrightStr = await this.common.getVal('website', 'copyright', '[]');
      let copyright: any = [];
      if (copyrightStr) {
        copyright = JSON.parse(copyrightStr);
      }
      return copyright;
    } catch (err) {
      throw new Error(`IndexService.config error: ${err}`);
    }
  }

  async save(req: any) {
    try {
      await this.common.set('website', 'copyright', req);
    } catch (err) {
      throw new Error(`IndexService.config error: ${err}`);
    }
  }
}
