/**
 * 业务异常。
 *
 * 原 Egg 实现中 service 会 throw new Error('账号已存在换一个吧！')，
 * 控制器 catch 后返回纯文本 'Internal Server Error'，真实提示语被吞掉。
 * 这里保留原提示语，并返回给前端（前端按 code 判断并弹出 msg）。
 */
export class BusinessException extends Error {
  code: number;

  constructor(message: string, code = 300) {
    super(message);
    this.name = 'BusinessException';
    this.code = code;
  }
}

/** 参数校验错误 code=310 */
export class ValidateException extends BusinessException {
  constructor(message: string) {
    super(message, 310);
  }
}

/** 未查询到数据 code=300 */
export class NotFoundException extends BusinessException {
  constructor(message: string) {
    super(message, 300);
  }
}

/** 数据重复 code=300 */
export class DuplicateException extends BusinessException {
  constructor(message: string) {
    super(message, 300);
  }
}
