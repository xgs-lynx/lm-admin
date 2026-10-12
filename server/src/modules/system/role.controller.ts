import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ok, ApiResult } from '../../common/result';
import { AuthRoleService } from './services/auth-role.service';

@Controller('api/system/role')
export class SystemRoleController {
  constructor(private readonly authRole: AuthRoleService) {}

  @Get('all')
  async roleAll(): Promise<ApiResult> {
    const data = await this.authRole.all();
    return ok(data);
  }

  @Get('list')
  async roleList(@Query() params: any): Promise<ApiResult> {
    const data = await this.authRole.list(params);
    return ok(data);
  }

  @Get('detail')
  async detail(@Query('id') id: number): Promise<ApiResult> {
    const data = await this.authRole.detail(id);
    return ok(data);
  }

  @Post('add')
  async add(@Body() addReq: any): Promise<ApiResult> {
    const data = await this.authRole.add(addReq);
    return ok(data);
  }

  @Post('edit')
  async edit(@Body() editReq: any): Promise<ApiResult> {
    await this.authRole.edit(editReq);
    return ok({});
  }

  @Post('del')
  async del(@Body('id') id: number): Promise<ApiResult> {
    await this.authRole.del(id);
    return ok({});
  }
}
