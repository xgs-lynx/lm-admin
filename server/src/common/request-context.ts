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

/**
 * C 端用户登录态。
 * 与 AdminSession 并列而非复用同一个 session 对象，避免 admin_id / user_id 语义混用
 * —— 后台代码里 `session['admin_id']` 一律按「后台管理员」解读。
 */
export interface ClientSession {
  user_id?: number;
}

export class RequestContext {
  session: AdminSession = {};
  /** C 端登录态（仅 /api/client/* 的请求会被填充） */
  clientSession: ClientSession = {};
  /** 请求头中的 token（后台） */
  token?: string;
  /** 请求头中的 client-token（C 端） */
  clientToken?: string;
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

/**
 * 取当前 C 端登录用户 id。
 * 业务层必须只从这里取用户身份，绝不要从请求入参取 userId —— 那是越权漏洞的根源。
 */
export function getClientUserId(): number | undefined {
  return getRequestContext()?.clientSession?.user_id;
}
