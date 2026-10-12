import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ok, ApiResult } from '../../common/result';
import { DictService } from './services/dict.service';

@Controller('api/setting/dict')
export class SettingDictController {
  constructor(private readonly dict: DictService) {}

  // ------- 字典类型 -------
  @Get('type/list')
  async list(@Query() listReq: any): Promise<ApiResult> {
    return ok(await this.dict.list(listReq));
  }

  @Get('type/all')
  async all(): Promise<ApiResult> {
    return ok(await this.dict.all());
  }

  @Post('type/add')
  async add(@Body() addReq: any): Promise<ApiResult> {
    return ok(await this.dict.add(addReq));
  }

  @Get('type/detail')
  async detail(@Query('id') id: number): Promise<ApiResult> {
    return ok(await this.dict.detail(id));
  }

  @Post('type/edit')
  async edit(@Body() editReq: any): Promise<ApiResult> {
    return ok(await this.dict.edit(editReq));
  }

  @Post('type/del')
  async del(@Body() delReq: any): Promise<ApiResult> {
    return ok(await this.dict.del(delReq));
  }

  // ------- 字典数据 -------
  @Get('data/list')
  async dataList(@Query() listReq: any): Promise<ApiResult> {
    return ok(await this.dict.dataList(listReq));
  }

  @Get('data/all')
  async dataAll(@Query() allReq: any): Promise<ApiResult> {
    return ok(await this.dict.dataAll(allReq));
  }

  @Get('data/detail')
  async dataDetail(@Query('id') id: number): Promise<ApiResult> {
    return ok(await this.dict.dataDetail(id));
  }

  @Post('data/add')
  async dataAdd(@Body() addReq: any): Promise<ApiResult> {
    return ok(await this.dict.dataAdd(addReq));
  }

  @Post('data/edit')
  async dataEdit(@Body() editReq: any): Promise<ApiResult> {
    return ok(await this.dict.dataEdit(editReq));
  }

  @Post('data/del')
  async dataDel(@Body() delReq: any): Promise<ApiResult> {
    return ok(await this.dict.dataDel(delReq));
  }
}
