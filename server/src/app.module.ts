import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseModule } from './database.module';
import { RedisModule } from './redis/redis.module';
import { ALL_MODELS } from './models';
import { AuthMiddleware } from './common/auth/auth.middleware';
import { ClientAuthMiddleware } from './common/auth/client-auth.middleware';
import { SystemModule } from './modules/system/system.module';
import { CommonModule } from './modules/common/common.module';
import { SettingModule } from './modules/setting/setting.module';
import { MonitorModule } from './modules/monitor/monitor.module';
import { ClientModule } from './modules/client/client.module';
import { WebModule } from './modules/web/web.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3307', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_DATABASE || 'lm_admin',
      models: ALL_MODELS,
      // 数据已导入，禁止自动同步表结构
      synchronize: false,
      autoLoadModels: false,
      logging: false,
      timezone: '+08:00',
      define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      },
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    }),
    DatabaseModule,
    RedisModule,
    SystemModule,
    CommonModule,
    SettingModule,
    MonitorModule,
    ClientModule,
    WebModule,
  ],
  providers: [AuthMiddleware, ClientAuthMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 后台 token 认证 + 权限校验（内部只作用于 /api/，且对 /api/client/ 提前放行）
    consumer.apply(AuthMiddleware).forRoutes('*');
    // C 端 token 认证（内部只作用于 /api/client/）。
    // 顺序硬要求：必须排在 AuthMiddleware 之后 —— RequestContext（AsyncLocalStorage）
    // 由 AuthMiddleware 建立，反序会让下游控制器读不到 clientSession。
    consumer.apply(ClientAuthMiddleware).forRoutes('*');
  }
}
