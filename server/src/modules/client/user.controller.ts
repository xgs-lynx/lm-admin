import { Body, Controller, Get, Post } from '@nestjs/common';
import { ok, ApiResult } from '../../common/result';
import { getClientUserId, getRequestContext } from '../../common/request-context';
import { ClientAuthService } from './services/client-auth.service';
import { ClientUserService } from './services/client-user.service';

@Controller('api/client/user')
export class ClientUserController {
  constructor(
    private readonly auth: ClientAuthService,
    private readonly user: ClientUserService,
  ) {}

  @Post('register')
  async register(@Body() body: any): Promise<ApiResult> {
    const data = await this.auth.register(body);
    return ok(data);
  }

  @Post('login')
  async login(@Body() body: any): Promise<ApiResult> {
    const data = await this.auth.login(body);
    return ok(data);
  }

  @Post('logout')
  async logout(): Promise<ApiResult> {
    const ctx = getRequestContext();
    const userId = getClientUserId();
    if (userId) {
      await this.auth.revokeToken(userId, ctx?.clientToken || '');
    }
    return ok('');
  }

  @Get('info')
  async info(): Promise<ApiResult> {
    const data = await this.user.info(getClientUserId());
    return ok(data);
  }

  @Post('setInfo')
  async setInfo(@Body() body: any): Promise<ApiResult> {
    const data = await this.user.setInfo(getClientUserId(), body);
    return ok(data);
  }

  @Post('changePassword')
  async changePassword(@Body() body: any): Promise<ApiResult> {
    const data = await this.user.changePassword(getClientUserId(), body);
    return ok(data);
  }
}
