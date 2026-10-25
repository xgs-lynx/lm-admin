import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import * as path from 'path';
// 必须用默认导入：`import * as hbs` 经 esModuleInterop 编译后会丢掉原型上的
// registerPartials 等方法（仅复制自有属性），运行时 TypeError。
import hbs from 'hbs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// 项目根目录（src 与 dist 的上一级都是 server/）
const projectRoot = path.resolve(__dirname, '..');
// 模板目录在 dist 之外，不随构建复制；生产部署时需与 dist、public 一并带上
const viewsRoot = path.join(projectRoot, 'views');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // 静态资源：/public/static、/public/uploads 等
  app.useStaticAssets(path.join(projectRoot, 'public'), {
    prefix: '/public/',
  });

  // 视图引擎：Handlebars（hbs）。
  // 全局布局：views/layouts/default.hbs，页面内容通过 {{{body}}} 注入。
  app.setBaseViewsDir(viewsRoot);
  app.setViewEngine('hbs');
  // 通过 view options 指定布局，避免依赖 hbs 默认的根目录 layout.hbs。
  app.set('view options', { layout: 'layouts/default' });
  // 局部模板：views/partials/{header,footer}.hbs，在布局中用 {{> header}} / {{> footer}} 引用。
  // 注册是异步的，hbs 会把期间到达的渲染请求排队，无需 await。
  hbs.registerPartials(path.join(viewsRoot, 'partials'));

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
