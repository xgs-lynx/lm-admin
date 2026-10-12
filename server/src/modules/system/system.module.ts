import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemAdminController } from './admin.controller';
import { SystemDeptController } from './dept.controller';
import { SystemPostController } from './post.controller';
import { SystemRoleController } from './role.controller';
import { SystemMenuController } from './menu.controller';
import { SystemLogController } from './log.controller';
import { AuthAdminService } from './services/auth-admin.service';
import { AuthDeptService } from './services/auth-dept.service';
import { AuthPostService } from './services/auth-post.service';
import { AuthRoleService } from './services/auth-role.service';
import { AuthMenuService } from './services/auth-menu.service';
import { LogService } from './services/log.service';
import { CommonService } from './services/common.service';

@Module({
  controllers: [
    SystemController,
    SystemAdminController,
    SystemDeptController,
    SystemPostController,
    SystemRoleController,
    SystemMenuController,
    SystemLogController,
  ],
  providers: [
    AuthAdminService,
    AuthDeptService,
    AuthPostService,
    AuthRoleService,
    AuthMenuService,
    LogService,
    CommonService,
  ],
  exports: [AuthAdminService, CommonService],
})
export class SystemModule {}
