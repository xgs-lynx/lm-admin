import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ok, ApiResult } from '../../common/result';
import { WebsiteService } from './services/website.service';
import { ProtocolService } from './services/protocol.service';
import { CopyrightService } from './services/copyright.service';
import { StorageService } from './services/storage.service';

@Controller('api/setting')
export class SettingController {
  constructor(
    private readonly website: WebsiteService,
    private readonly protocol: ProtocolService,
    private readonly copyright: CopyrightService,
    private readonly storage: StorageService,
  ) {}

  // -------- 网站信息 --------
  @Get('website/detail')
  async websiteDetails(): Promise<ApiResult> {
    return ok(await this.website.details());
  }

  @Post('website/save')
  async websiteSave(@Body() params: any): Promise<ApiResult> {
    await this.website.save(params);
    return ok({});
  }

  // -------- 协议 --------
  @Get('protocol/detail')
  async protocolDetails(): Promise<ApiResult> {
    return ok(await this.protocol.details());
  }

  @Post('protocol/save')
  async protocolSave(@Body() params: any): Promise<ApiResult> {
    await this.protocol.save(params);
    return ok({});
  }

  // -------- 版权信息 --------
  @Get('copyright/detail')
  async copyrightDetails(): Promise<ApiResult> {
    return ok(await this.copyright.details());
  }

  @Post('copyright/save')
  async copyrightSave(@Body() params: any): Promise<ApiResult> {
    await this.copyright.save(JSON.stringify(params));
    return ok({});
  }

  // -------- 存储设置 --------
  @Get('storage/list')
  async storageList(): Promise<ApiResult> {
    return ok(await this.storage.list());
  }

  @Get('storage/detail')
  async storageDetail(@Query('alias') alias: string): Promise<ApiResult> {
    return ok(await this.storage.detail(alias));
  }

  @Post('storage/edit')
  async storageEdit(@Body() editReq: any): Promise<ApiResult> {
    return ok(await this.storage.edit(editReq));
  }

  @Post('storage/change')
  async storageChange(@Body() body: any): Promise<ApiResult> {
    const { alias, status } = body;
    return ok(await this.storage.change(alias, status));
  }
}
