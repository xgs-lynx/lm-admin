import { Injectable } from '@nestjs/common';
import { CommonService } from '../../system/services/common.service';

@Injectable()
export class ProtocolService {
  constructor(private readonly common: CommonService) {}

  async details() {
    try {
      const defaultVal = '{"name":"","content":""}';
      const service = await this.common.getVal('protocol', 'service', defaultVal);
      const privacy = await this.common.getVal('protocol', 'privacy', defaultVal);
      const data = {
        service: JSON.parse(service),
        privacy: JSON.parse(privacy),
      };
      return data;
    } catch (err) {
      throw new Error(`service error: ${err}`);
    }
  }

  async save(req: any) {
    const { service, privacy } = req;

    try {
      const serviceJson = JSON.stringify(service);
      const privacyJson = JSON.stringify(privacy);
      await this.common.set('protocol', 'service', serviceJson);
      await this.common.set('protocol', 'privacy', privacyJson);
    } catch (err) {
      throw new Error(`service error: ${err}`);
    }
  }
}
