/**
 * 响应体：{ code, data, message }
 * 兼容：前端 request 拦截器读取的是 msg 字段，这里同时输出 msg（等价于 message）。
 */
export interface ApiResult {
  code: number;
  data: any;
  message: string;
  msg: string;
}

export function result({
  code = 200,
  data = '',
  message = '请求成功',
  status = 200,
}: {
  code?: number;
  data?: any;
  message?: string;
  status?: number;
} = {}): ApiResult & { status: number } {
  if (code !== 200) {
    message = message === '请求成功' ? '请求失败' : message;
  }
  return { code, data, message, msg: message, status };
}

/** 成功响应体 */
export function ok(data: any = ''): ApiResult {
  return { code: 200, data, message: '请求成功', msg: '请求成功' };
}

/** 失败响应体（HTTP 仍为 200，前端按 code 分支处理） */
export function fail(message: string, code = 300, data: any = ''): ApiResult {
  return { code, data, message, msg: message };
}
