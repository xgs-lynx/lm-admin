import { Injectable } from '@nestjs/common';
import urlUtil from '../../../common/utils/url.util';
import { CommonService } from '../../system/services/common.service';

@Injectable()
export class WebsiteService {
  constructor(private readonly common: CommonService) {}

  async details() {
    try {
      const website = await this.common.get('website');
      return {
        name: website.name,
        logo: urlUtil.toAbsoluteUrl(website.logo),
        favicon: urlUtil.toAbsoluteUrl(website.favicon),
        backdrop: urlUtil.toAbsoluteUrl(website.backdrop),
        shopName: website.shopName,
        shopLogo: urlUtil.toAbsoluteUrl(website.shopLogo),
      };
    } catch (err) {
      throw new Error(`websiteService.config error: ${err}`);
    }
  }

  async save(req: any) {
    try {
      await Promise.all([
        this.common.set('website', 'name', req.name),
        this.common.set('website', 'logo', urlUtil.toRelativeUrl(req.logo)),
        this.common.set('website', 'favicon', urlUtil.toRelativeUrl(req.favicon)),
        this.common.set('website', 'backdrop', urlUtil.toRelativeUrl(req.backdrop)),
        this.common.set('website', 'shopName', req.shopName),
        this.common.set('website', 'shopLogo', urlUtil.toRelativeUrl(req.shopLogo)),
      ]);
    } catch (err) {
      throw new Error(`websiteService.config error: ${err}`);
    }
  }
}
