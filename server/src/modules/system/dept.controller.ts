import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ok, ApiResult } from '../../common/result';
import { AuthDeptService } from './services/auth-dept.service';

@Controller('api/system/dept')
export class SystemDeptController {
  constructor(private readonly authDept: AuthDeptService) {}

  @Get('list')
  async deptList(@Query() listReq: any): Promise<ApiResult> {
    const data = await this.authDept.list(listReq);
    return ok(data);
  }

  @Post('add')
  async deptAdd(@Body() addReq: any): Promise<ApiResult> {
    const data = await this.authDept.add(addReq);
    return ok(data);
  }

  @Get('detail')
  async deptDetail(@Query('id') id: number): Promise<ApiResult> {
    const data = await this.authDept.detail(id);
    return ok(data);
  }

  @Post('edit')
  async deptEdit(@Body() editReq: any): Promise<ApiResult> {
    await this.authDept.edit(editReq);
    return ok({});
  }

  @Post('del')
  async deptDel(@Body('id') id: number): Promise<ApiResult> {
    await this.authDept.del(id);
    return ok({});
  }

  @Get('all')
  async deptAll(): Promise<ApiResult> {
    const data = await this.authDept.all();
    return ok(data);
  }
}
