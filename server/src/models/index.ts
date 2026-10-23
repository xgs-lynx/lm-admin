export * from './album.model';
export * from './album-cate.model';
export * from './article.model';
export * from './article-category.model';
export * from './article-collect.model';
export * from './decorate-page.model';
export * from './decorate-tabbar.model';
export * from './dict-data.model';
export * from './dict-type.model';
export * from './hot-search.model';
export * from './landing-page.model';
export * from './notice-setting.model';
export * from './official-reply.model';
export * from './system-auth-admin.model';
export * from './system-auth-dept.model';
export * from './system-auth-menu.model';
export * from './system-auth-perm.model';
export * from './system-auth-post.model';
export * from './system-auth-role.model';
export * from './system-config.model';
export * from './system-log-login.model';
export * from './system-log-operate.model';
export * from './system-log-sms.model';
export * from './user.model';
export * from './user-auth.model';

import { Album } from './album.model';
import { AlbumCate } from './album-cate.model';
import { Article } from './article.model';
import { ArticleCategory } from './article-category.model';
import { ArticleCollect } from './article-collect.model';
import { DecoratePage } from './decorate-page.model';
import { DecorateTabbar } from './decorate-tabbar.model';
import { DictData } from './dict-data.model';
import { DictType } from './dict-type.model';
import { HotSearch } from './hot-search.model';
import { LandingPage } from './landing-page.model';
import { NoticeSetting } from './notice-setting.model';
import { OfficialReply } from './official-reply.model';
import { SystemAuthAdmin } from './system-auth-admin.model';
import { SystemAuthDept } from './system-auth-dept.model';
import { SystemAuthMenu } from './system-auth-menu.model';
import { SystemAuthPerm } from './system-auth-perm.model';
import { SystemAuthPost } from './system-auth-post.model';
import { SystemAuthRole } from './system-auth-role.model';
import { SystemConfig } from './system-config.model';
import { SystemLogLogin } from './system-log-login.model';
import { SystemLogOperate } from './system-log-operate.model';
import { SystemLogSms } from './system-log-sms.model';
import { User } from './user.model';
import { UserAuth } from './user-auth.model';

/** 全部模型列表，用于 SequelizeModule.forRoot({ models }) */
export const ALL_MODELS = [
  Album,
  AlbumCate,
  Article,
  ArticleCategory,
  ArticleCollect,
  DecoratePage,
  DecorateTabbar,
  DictData,
  DictType,
  HotSearch,
  LandingPage,
  NoticeSetting,
  OfficialReply,
  SystemAuthAdmin,
  SystemAuthDept,
  SystemAuthMenu,
  SystemAuthPerm,
  SystemAuthPost,
  SystemAuthRole,
  SystemConfig,
  SystemLogLogin,
  SystemLogOperate,
  SystemLogSms,
  User,
  UserAuth,
];
