import { Controller, Get, Query } from '@nestjs/common';
import { ok, ApiResult } from '../../common/result';
import { LogService } from './services/log.service';

@Controller('api/system/log')
export class SystemLogController {
  constructor(private readonly logService: LogService) {}

  @Get('operate')
  async operate(@Query() listReq: any): Promise<ApiResult> {
    const data = await this.logService.operate(listReq);
    return ok(data);
  }

  @Get('login')
  async login(@Query() listReq: any): Promise<ApiResult> {
    const data = await this.logService.login(listReq);
    return ok(data);
  }
}
