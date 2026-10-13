import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ok, ApiResult } from '../../common/result';
import { getClientUserId } from '../../common/request-context';
import { ClientArticleService } from './services/client-article.service';

@Controller('api/client/article')
export class ClientArticleController {
  constructor(private readonly article: ClientArticleService) {}

  @Post('collect')
  async collect(@Body() body: any): Promise<ApiResult> {
    const data = await this.article.collect(getClientUserId(), body);
    return ok(data);
  }

  @Post('collectCancel')
  async collectCancel(@Body() body: any): Promise<ApiResult> {
    const data = await this.article.collectCancel(getClientUserId(), body);
    return ok(data);
  }

  @Get('collectList')
  async collectList(@Query() query: any): Promise<ApiResult> {
    const data = await this.article.collectList(getClientUserId(), query);
    return ok(data);
  }
}
