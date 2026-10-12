/**
 * 请求上下文。
 *
 * 原 Egg 实现把当前登录信息写入 ctx.session（admin_id / role / username / nickname），
 * 各个 service 再通过 ctx.session 读取。这里用 AsyncLocalStorage 提供等价的“请求级会话”，
 * 这样 service 层可以照原样读取这些值，而不需要层层透传参数。
 */
import { AsyncLocalStorage } from 'async_hooks';

export interface AdminSession {
  admin_id?: number;
  role?: string;
  username?: string;
  nickname?: string;
}

export class RequestContext {
  session: AdminSession = {};
  /** 请求头中的 token */
  token?: string;
  /** 客户端 IP */
  ip?: string;
  /** User-Agent */
  userAgent?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/** 获取当前请求上下文（非请求环境返回 undefined） */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}
