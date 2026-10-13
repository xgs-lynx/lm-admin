/**
 * C 端（web / uniapp / flutter 等客户端）token 认证中间件。
 *
 * 与后台的 AuthMiddleware 构成一对，靠 config.clientUriPrefix 互斥：
 *   - AuthMiddleware 在开头对 /api/client/ 提前 return；
 *   - 本中间件对非 /api/client/ 提前 return。
 * 因此后台 token 与 C 端 token 在物理上互不通用（连请求头都不同名）。
 *
 * 挂载顺序要求：必须排在 AuthMiddleware 之后（见 app.module.ts）。RequestContext
 * 由 AuthMiddleware 建立，顺序反了会导致下游控制器拿到的 clientSession 丢失。
 */
import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { RedisService } from '../../redis/redis.service';
import { User } from '../../models/user.model';
import { requestContextStorage, RequestContext } from '../request-context';

const { clientUriPrefix, clientNotLoginUri, clientTokenKey, clientTokenTtl, clientTokenRenewBelow } =
  config;

/** 与 AuthMiddleware 的拒绝方式保持一致：HTTP 403，body 仍是统一响应结构 */
function reject(code: number, message: string) {
  throw new HttpException({ code, data: '', message, msg: message }, HttpStatus.FORBIDDEN);
}

@Injectable()
export class ClientAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly redis: RedisService,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const pathname = String(req.originalUrl || req.url || '').split('?')[0];

    // 只接管 C 端接口
    if (!pathname.startsWith(clientUriPrefix)) {
      return next();
    }
    // 预检请求正常由 cors 中间件更早应答，这里兜底放行
    if (req.method === 'OPTIONS') {
      return next();
    }

    const existing = requestContextStorage.getStore();
    if (existing) {
      await this.handle(req, existing, pathname);
      return next();
    }

    // 兜底：AuthMiddleware 未运行时自建上下文，保持行为一致而不至于崩溃
    const ctx = new RequestContext();
    ctx.ip = req.ip || (req.socket && req.socket.remoteAddress) || '';
    ctx.userAgent = (req.headers['user-agent'] as string) || '';
    await requestContextStorage.run(ctx, async () => {
      await this.handle(req, ctx, pathname);
      next();
    });
  }

  private async handle(req: Request, ctx: RequestContext, pathname: string) {
    // 免登录接口
    if (clientNotLoginUri.includes(pathname)) {
      return;
    }

    const token = req.headers['client-token'] as string;
    if (!token) {
      reject(332, 'token参数为空');
      return;
    }

    // get 一步同时判存在与取值：key 不存在时 RedisService.get 返回 false
    const tokenKey = clientTokenKey + token;
    const cached = await this.redis.get(tokenKey);
    if (cached === false || cached === null || cached === undefined) {
      reject(333, 'token参数无效');
      return;
    }

    const userId = parseInt(String(cached), 10);
    if (isNaN(userId)) {
      reject(333, 'token参数无效');
      return;
    }

    // 每请求直查 DB（主键查询，成本与后台 AuthMiddleware 相当）。
    // 刻意不做 Redis 用户缓存：lm_user 目前没有后台写接口，「缓存何时失效」无从谈起，
    // 直查是唯一能保证 禁用/删除 立即生效的方案。
    const user = await this.userModel.findOne({
      where: { id: userId },
      attributes: ['id', 'isDelete', 'isDisable'],
    });

    if (!user || user.isDelete === 1) {
      await this.redis.del(tokenKey);
      reject(333, '用户被删除');
      return;
    }

    if (user.isDisable === 1) {
      reject(331, '登录账号已被禁用了');
      return;
    }

    // 滑动续签：剩余不足阈值才写 Redis，最多 15 天写一次
    const ttl = await this.redis.ttl(tokenKey);
    if (ttl < clientTokenRenewBelow) {
      await this.redis.expire(tokenKey, clientTokenTtl);
    }

    ctx.clientToken = token;
    ctx.clientSession.user_id = userId;
  }
}
