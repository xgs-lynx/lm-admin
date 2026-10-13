import { Module } from '@nestjs/common';
import { SystemModule } from '../system/system.module';
import { CommonModule } from '../common/common.module';
import { ClientUserController } from './user.controller';
import { ClientArticleController } from './article.controller';
import { ClientUploadController } from './upload.controller';
import { ClientAuthService } from './services/client-auth.service';
import { ClientUserService } from './services/client-user.service';
import { ClientArticleService } from './services/client-article.service';

/**
 * C 端（web / uniapp / flutter 等客户端）接口模块，统一挂在 /api/client/* 下，
 * 由 common/auth/client-auth.middleware.ts 独立鉴权（不走后台的 token / 角色权限体系）。
 *
 * 依赖：
 *  - SystemModule：CommonService（读 lm_system_config，如 login.loginWay、user.defaultAvatar）
 *  - CommonModule：AlbumService（头像上传复用其按存储引擎分流的上传能力）
 *  - RedisService / 各模型：分别由全局的 RedisModule / DatabaseModule 提供
 */
@Module({
  imports: [SystemModule, CommonModule],
  controllers: [ClientUserController, ClientArticleController, ClientUploadController],
  providers: [ClientAuthService, ClientUserService, ClientArticleService],
})
export class ClientModule {}
