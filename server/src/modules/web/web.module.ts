import { Module } from '@nestjs/common';

/**
 * Web 前台模块（服务端渲染）。
 *
 * 视图引擎（hbs）已在 main.ts 中配置：
 *  - 模板目录：server/views
 *  - 布局模板：views/layout.hbs（页面内容通过 {{{body}}} 注入）
 *  - 局部模板：views/partials/*.hbs
 *
 * 目前只留模块骨架，控制器 / 视图后续按需添加。
 */
@Module({})
export class WebModule {}
