import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';

/**
 * 统一异常处理。
 *
 * - 200  成功
 * - 300  业务失败（原 service 抛出的中文提示语）
 * - 310  参数校验错误
 * - 332  token 为空
 * - 333  token 无效
 * - 331  账号被禁用
 * - 403  无权限
 * - 500  系统错误
 *
 * 业务异常统一以 HTTP 200 返回（与原实现一致，前端只按 code 分支处理）。
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let code = 500;
    let message = '系统错误';
    let status = 500;

    if (exception instanceof BusinessException) {
      code = exception.code;
      message = exception.message;
      status = 200;
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;
      status = exception.getStatus();
      // 中间件抛出的 403 已带 code/message
      if (res && typeof res === 'object' && res.code) {
        code = res.code;
        message = res.message;
      } else {
        code = 500;
        message = typeof res === 'string' ? res : res?.message || exception.message;
      }
      if (status === 403 && code === 500) {
        code = 403;
      }
    } else {
      message = (exception as Error)?.message || '系统错误';
    }

    this.logger.error(`${request.method} ${request.originalUrl} -> ${message}`);

    response.status(status).json({
      code,
      data: '',
      message,
      msg: message,
    });
  }
}
