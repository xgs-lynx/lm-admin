import {
  ArgumentsHost,
  Catch,
  Controller,
  ExceptionFilter,
  HttpStatus,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MulterError } from 'multer';
import { Response } from 'express';
import * as path from 'path';
import { ok, ApiResult } from '../../common/result';
import { getClientUserId } from '../../common/request-context';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ClientUserService } from './services/client-user.service';

// C 端头像：只允许位图，且显式排除 .svg
//（SVG 可内嵌 <script>，而 /public 按扩展名回 content-type → 存储型 XSS）
const AVATAR_WHITELIST = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 比后台的 10MB 更紧

const avatarUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: AVATAR_MAX_SIZE, files: 1, fields: 10 },
  fileFilter: (req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLocaleLowerCase();
    if (!AVATAR_WHITELIST.includes(ext)) {
      cb(new BusinessException(`Invalid file type: ${ext}`), false);
      return;
    }
    cb(null, true);
  },
};

/**
 * multer 的超限错误是 MulterError（非 HttpException），落到全局过滤器会被当成
 * 500「系统错误」。这里转成与其他业务失败一致的响应体。
 * 只声明 @Catch(MulterError)，其他异常仍由全局 AllExceptionsFilter 处理。
 */
@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const message =
      exception.code === 'LIMIT_FILE_SIZE'
        ? `头像不能超过 ${AVATAR_MAX_SIZE / 1024 / 1024}MB`
        : `上传失败：${exception.message}`;
    response.status(HttpStatus.OK).json({ code: 300, data: '', message, msg: message });
  }
}

@Controller('api/client/upload')
export class ClientUploadController {
  constructor(private readonly user: ClientUserService) {}

  @Post('avatar')
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('file', avatarUploadOptions))
  async avatar(@UploadedFile() file: any): Promise<ApiResult> {
    if (!file) {
      throw new BusinessException('上传文件不能为空');
    }
    const data = await this.user.uploadAvatar(getClientUserId(), file);
    return ok(data);
  }
}
