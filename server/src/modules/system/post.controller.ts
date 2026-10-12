import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ok, ApiResult } from '../../common/result';
import { AuthPostService } from './services/auth-post.service';

@Controller('api/system/post')
export class SystemPostController {
  constructor(private readonly authPost: AuthPostService) {}

  @Get('list')
  async postList(@Query() params: any): Promise<ApiResult> {
    const data = await this.authPost.list(params);
    return ok(data);
  }

  @Post('add')
  async postAdd(@Body() addReq: any): Promise<ApiResult> {
    const data = await this.authPost.add(addReq);
    return ok(data);
  }

  @Get('detail')
  async postDetail(@Query('id') id: number): Promise<ApiResult> {
    const data = await this.authPost.detail(id);
    return ok(data);
  }

  @Post('edit')
  async postEdit(@Body() editReq: any): Promise<ApiResult> {
    await this.authPost.edit(editReq);
    return ok({});
  }

  @Post('del')
  async postDel(@Body('id') id: number): Promise<ApiResult> {
    await this.authPost.del(id);
    return ok({});
  }

  @Get('all')
  async postAll(): Promise<ApiResult> {
    const data = await this.authPost.all();
    return ok(data);
  }
}
