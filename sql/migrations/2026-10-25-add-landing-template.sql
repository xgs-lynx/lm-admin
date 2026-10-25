-- ---------------------------------------------------------------------------
-- 迁移：落地页管理 - 模板文件选择
--
-- 背景：落地页需要支持选择不同的 hbs 模板文件进行渲染。
--       模板文件放在 server/views/landing/templates/*.hbs，后台通过下拉框选择，
--       前台 res.render 时使用所选模板；模板文件被删除时回退到 default.hbs。
--
-- 内容：
--   1) lm_landing_page 增加 template_file 字段，默认 default.hbs；
--   2) 新增 web:landing:templates 权限（模板列表接口
--      GET /api/web/landing/templates）。
--
-- 幂等：可重复执行。加字段查 information_schema 后动态拼 DDL；
--       菜单行用 ON DUPLICATE KEY UPDATE；perm 行用 NOT EXISTS 去重。
--
-- 注意：sql/install.sql 已同步加入字段和菜单行，全新环境无需执行本文件。
--
-- 执行：
--   mysql -h127.0.0.1 -P3307 -uroot -p123456 lm_admin \
--     < sql/migrations/2026-10-25-add-landing-template.sql
-- ---------------------------------------------------------------------------

-- 1) template_file 字段
SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `lm_landing_page` ADD COLUMN `template_file` varchar(100) NOT NULL DEFAULT ''default.hbs'' COMMENT ''落地页模板文件'' AFTER `cta_link`',
    'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'lm_landing_page'
    AND column_name = 'template_file'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) 模板列表接口权限
INSERT INTO `lm_system_auth_menu`
  (`id`, `pid`, `menu_type`, `menu_name`, `menu_icon`, `menu_sort`, `perms`,
   `paths`, `component`, `selected`, `params`, `is_cache`, `is_show`, `is_disable`,
   `create_time`, `update_time`)
VALUES
  (717, 711, 'A', '落地页模板列表', '', 0, 'web:landing:templates',
   '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
  `pid`         = VALUES(`pid`),
  `menu_type`   = VALUES(`menu_type`),
  `menu_name`   = VALUES(`menu_name`),
  `menu_icon`   = VALUES(`menu_icon`),
  `menu_sort`   = VALUES(`menu_sort`),
  `perms`       = VALUES(`perms`),
  `is_disable`  = 0,
  `update_time` = VALUES(`update_time`);

-- 3) 已拥有落地页管理页（711）的角色自动获得模板列表权限
INSERT INTO `lm_system_auth_perm` (`id`, `role_id`, `menu_id`)
SELECT REPLACE(UUID(), '-', ''), p.`role_id`, 717
FROM (
  SELECT DISTINCT `role_id` FROM `lm_system_auth_perm` WHERE `menu_id` = 711
) p
WHERE NOT EXISTS (
  SELECT 1 FROM `lm_system_auth_perm` x
  WHERE x.`role_id` = p.`role_id` AND x.`menu_id` = 717
);

-- 4) 复核
SHOW COLUMNS FROM `lm_landing_page` LIKE 'template_file';
SELECT `id`, `pid`, `menu_type`, `menu_name`, `perms`, `is_show`
FROM `lm_system_auth_menu`
WHERE `id` = 717;
