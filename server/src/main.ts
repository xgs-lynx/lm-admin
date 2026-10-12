import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// 项目根目录
const projectRoot = path.resolve(__dirname, '..');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // 静态资源：/public/static、/public/uploads 等
  app.useStaticAssets(path.join(projectRoot, 'public'), {
    prefix: '/public/',
  });

  // 跨域：对应原 egg-cors origin: '*'
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
  });

  // 请求体大小（对应原 config.multipart 的字段限制）
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });

  // 统一异常处理
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = parseInt(process.env.PORT || '8001', 10);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  Logger.log(`lm_admin server is running on http://127.0.0.1:${port}`, 'Bootstrap');
}

bootstrap();
