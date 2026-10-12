import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ok, ApiResult } from '../../common/result';
import { AuthMenuService } from './services/auth-menu.service';

@Controller('api/system/menu')
export class SystemMenuController {
  constructor(private readonly authMenu: AuthMenuService) {}

  @Get('list')
  async menuList(@Query() params: any): Promise<ApiResult> {
    const data = await this.authMenu.list();
    return ok(data);
  }

  @Get('detail')
  async menuDetail(@Query('id') id: number): Promise<ApiResult> {
    const data = await this.authMenu.detail(id);
    return ok(data);
  }

  @Post('add')
  async menuAdd(@Body() addReq: any): Promise<ApiResult> {
    await this.authMenu.add(addReq);
    return ok({});
  }

  @Post('edit')
  async menuEdit(@Body() editReq: any): Promise<ApiResult> {
    await this.authMenu.edit(editReq);
    return ok({});
  }

  @Post('del')
  async menuDel(@Body('id') id: number): Promise<ApiResult> {
    await this.authMenu.del(id);
    return ok({});
  }
}
