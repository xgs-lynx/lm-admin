import { Module } from '@nestjs/common';
import { SystemModule } from '../system/system.module';
import { LandingController } from './landing.controller';
import { LandingWebController } from './landing-web.controller';
import { LandingService } from './services/landing.service';

/**
 * Web 前台模块（服务端渲染）。
 *
 * 视图引擎（hbs）已在 main.ts 中配置：
 *  - 模板目录：server/views
 *  - 布局模板：views/layouts/default.hbs（页面内容通过 {{{body}}} 注入）
 *  - 局部模板：views/partials/*.hbs
 *
 * 后台落地页管理接口挂在 /api/web/landing，公开展示页为 / 与 /landing/:slug。
 */
@Module({
  imports: [SystemModule],
  controllers: [LandingController, LandingWebController],
  providers: [LandingService],
})
export class WebModule {}
