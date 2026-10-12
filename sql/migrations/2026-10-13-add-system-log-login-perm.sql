-- ---------------------------------------------------------------------------
-- 迁移：系统日志 - 登录日志查看权限
--
-- 背景：登录日志以 el-tabs 标签页并入「系统维护 / 系统日志」页（菜单 553），
--       页面路由不变；后端新增接口 GET /api/system/log/login，权限串 system:log:login。
--
-- 权限机制：AuthMiddleware 把 /api/system/log/login 转成 system:log:login，
--       与该角色在 Redis 哈希 (redisPrefix)backstage:roles 中的权限串列表比对，
--       不含则返回 403。该列表由 AuthAdminService.cacheRoleMenusByRoleId 生成：
--       取 menu_type IN ('C','A') 且 is_disable=0 的菜单行的 perms 拼成。
--
--       因此这里插入一条 menu_type='A' 的菜单行来承载权限串：
--         - 会被 cacheRoleMenusByRoleId 采纳（取 'C','A'）→ 权限生效；
--         - 不会被 selectMenuByRoleId 下发（只取 'M','C'）→ 侧边栏/路由不会多出一项；
--         - menuService.list() 无类型过滤 → 会出现在「角色管理 - 权限设置」授权树中可勾选。
--       这与既有的按钮权限行（system:admin:add、system:role:detail 等）形态完全一致。
--
-- 幂等：可重复执行。菜单行用 ON DUPLICATE KEY UPDATE 收敛到目标状态；
--       perm 行用 NOT EXISTS 去重。
--
-- 前置：本文件假定 lm_system_auth_menu 的最大 id 为 701。若将来 install.sql 新增了
--       id=702 的菜单，需同步调整本文件中的两处 702。
--
-- 注意：sql/install.sql 未被修改，因此全新环境导入 install.sql 后需额外执行本文件。
--
-- 执行：
--   mysql -h127.0.0.1 -P3307 -uroot -p lm_admin < sql/migrations/2026-10-13-add-system-log-login-perm.sql
-- ---------------------------------------------------------------------------

-- 1) 新增「登录日志」权限行，挂在 553（系统日志）下
INSERT INTO `lm_system_auth_menu`
  (`id`, `pid`, `menu_type`, `menu_name`, `menu_icon`, `menu_sort`, `perms`,
   `paths`, `component`, `selected`, `params`, `is_cache`, `is_show`, `is_disable`,
   `create_time`, `update_time`)
VALUES
  (702, 553, 'A', '登录日志', '', 0, 'system:log:login',
   '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
  `pid`        = VALUES(`pid`),
  `menu_type`  = VALUES(`menu_type`),
  `menu_name`  = VALUES(`menu_name`),
  `perms`      = VALUES(`perms`),
  `is_disable` = 0;

-- 2) 把新权限授予「当前已拥有 553（系统日志页）的角色」
--    本地 lm_system_auth_perm 为空表，故此处当前不会插入任何行（预期行为）；
--    已有授权的环境会为每个拥有 553 的角色补一行。
--    用派生表包一层，规避 MySQL 对 INSERT ... SELECT 自引用同表的限制。
INSERT INTO `lm_system_auth_perm` (`id`, `role_id`, `menu_id`)
SELECT REPLACE(UUID(), '-', ''), p.`role_id`, 702
FROM (
  SELECT DISTINCT `role_id` FROM `lm_system_auth_perm` WHERE `menu_id` = 553
) p
WHERE NOT EXISTS (
  SELECT 1 FROM `lm_system_auth_perm` x
  WHERE x.`role_id` = p.`role_id` AND x.`menu_id` = 702
);

-- 3) Redis 缓存无需手工清理：AuthMiddleware 对每个非超管请求都会重跑
--    cacheRoleMenusByRoleId 覆盖该哈希，下一次请求即生效。
--    确需立即刷新可执行：redis-cli DEL "Like:backstage:roles"
