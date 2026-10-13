-- ---------------------------------------------------------------------------
-- 迁移：存储设置 - 详情 / 启用 两个接口的权限
--
-- 背景：存储设置页（菜单 555，「系统设置 / 存储设置」）的「设置」弹窗在打开时会调用
--       GET /api/setting/storage/detail（见 admin/src/views/setting/storage/edit.vue
--       的 getDetail），该接口在菜单表里没有对应的权限行；
--       POST /api/setting/storage/change 同样缺失。
--
-- 权限机制：AuthMiddleware 把 /api/setting/storage/detail 转成 setting:storage:detail，
--       与该角色在 Redis 哈希 (redisPrefix)backstage:roles 中的权限串列表比对，
--       不含则返回 403。该列表由 AuthAdminService.cacheRoleMenusByRoleId 取
--       menu_type IN ('C','A') 且 is_disable=0 的菜单行的 perms 拼成。
--
--       因此这里插入两条 menu_type='A' 的菜单行来承载权限串：
--         - 会被 cacheRoleMenusByRoleId 采纳（取 'C','A'）→ 权限生效；
--         - 不会被 selectMenuByRoleId 下发（只取 'M','C'）→ 侧边栏/路由不会多出一项；
--         - menuService.list() 无类型过滤 → 会出现在「角色管理 - 权限设置」授权树中可勾选。
--       形态与既有按钮权限行（556 保存配置、702 登录日志）完全一致。
--
-- 幂等：可重复执行。菜单行用 ON DUPLICATE KEY UPDATE 收敛到目标状态；
--       perm 行用 NOT EXISTS 去重。
--
-- 前置：本文件假定 lm_system_auth_menu 的最大 id 为 702
--       （已被 2026-10-13-add-system-log-login-perm.sql 占用）。
--       若将来 install.sql 新增了 703/704，需同步调整本文件中的 id。
--
-- 注意：sql/install.sql 未被修改，因此全新环境导入 install.sql 后需额外执行本文件。
--
-- 执行：
--   mysql -h127.0.0.1 -P3307 -uroot -p lm_admin < sql/migrations/2026-10-13-add-storage-detail-change-perm.sql
-- ---------------------------------------------------------------------------

-- 1) 新增两条权限行，挂在 555（存储设置）下
INSERT INTO `lm_system_auth_menu`
  (`id`, `pid`, `menu_type`, `menu_name`, `menu_icon`, `menu_sort`, `perms`,
   `paths`, `component`, `selected`, `params`, `is_cache`, `is_show`, `is_disable`,
   `create_time`, `update_time`)
VALUES
  (703, 555, 'A', '存储详情', '', 0, 'setting:storage:detail',
   '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  (704, 555, 'A', '启用存储', '', 0, 'setting:storage:change',
   '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
  `pid`        = VALUES(`pid`),
  `menu_type`  = VALUES(`menu_type`),
  `menu_name`  = VALUES(`menu_name`),
  `perms`      = VALUES(`perms`),
  `is_disable` = 0;

-- 2) 把新权限授予「当前已拥有 555（存储设置页）的角色」
--    本地 lm_system_auth_perm 为空表，故此处当前不会插入任何行（预期行为，
--    与上一个迁移一致）；已有授权的环境会为每个拥有 555 的角色各补两行。
--    用派生表包一层，规避 MySQL 对 INSERT ... SELECT 自引用同表的限制。
INSERT INTO `lm_system_auth_perm` (`id`, `role_id`, `menu_id`)
SELECT REPLACE(UUID(), '-', ''), p.`role_id`, m.`menu_id`
FROM (
  SELECT DISTINCT `role_id` FROM `lm_system_auth_perm` WHERE `menu_id` = 555
) p
CROSS JOIN (
  SELECT 703 AS `menu_id`
  UNION ALL SELECT 704
) m
WHERE NOT EXISTS (
  SELECT 1 FROM `lm_system_auth_perm` x
  WHERE x.`role_id` = p.`role_id` AND x.`menu_id` = m.`menu_id`
);

-- 3) Redis 缓存无需手工清理：AuthMiddleware 对每个非超管请求都会重跑
--    cacheRoleMenusByRoleId 覆盖该哈希，下一次请求即生效。
--    确需立即刷新可执行：redis-cli DEL "Like:backstage:roles"
