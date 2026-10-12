import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ALL_MODELS } from './models';

/**
 * 全局注册所有模型，各业务模块可直接 @InjectModel 使用。
 */
@Global()
@Module({
  imports: [SequelizeModule.forFeature(ALL_MODELS)],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
