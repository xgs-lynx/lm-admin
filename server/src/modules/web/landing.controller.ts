import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiResult, ok } from '../../common/result';
import { LandingService } from './services/landing.service';

@Controller('api/web/landing')
export class LandingController {
  constructor(private readonly landing: LandingService) {}

  @Get('list')
  async list(@Query() listReq: any): Promise<ApiResult> {
    return ok(await this.landing.adminList(listReq));
  }

  @Get('templates')
  async templates(): Promise<ApiResult> {
    return ok(await this.landing.listTemplates());
  }

  @Get('detail')
  async detail(@Query('id') id: number): Promise<ApiResult> {
    return ok(await this.landing.adminDetail(id));
  }

  @Post('add')
  async add(@Body() addReq: any): Promise<ApiResult> {
    return ok(await this.landing.adminAdd(addReq));
  }

  @Post('edit')
  async edit(@Body() editReq: any): Promise<ApiResult> {
    return ok(await this.landing.adminEdit(editReq));
  }

  @Post('del')
  async del(@Body() delReq: any): Promise<ApiResult> {
    return ok(await this.landing.adminDel(delReq));
  }

  @Post('change')
  async change(@Body() changeReq: any): Promise<ApiResult> {
    return ok(await this.landing.adminChange(changeReq));
  }
}
