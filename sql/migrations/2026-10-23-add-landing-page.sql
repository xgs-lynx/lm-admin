-- ---------------------------------------------------------------------------
-- 迁移：官网落地页管理 + Web 前台展示
--
-- 内容：
--   1) 新建 lm_landing_page 表（富文本落地页，含 SEO 字段与软删除）。
--   2) 新增「官网管理 / 落地页管理」菜单及后端接口权限。
--
-- 权限说明：
--   AuthMiddleware 把 /api/web/landing/list 转成 web:landing:list 后与角色权限比对。
--   - 711（C，落地页管理）承载列表接口权限，并生成 /web/landing 路由；
--   - 712（C，落地页编辑）是隐藏编辑页，perms 同时用于 /api/web/landing/edit；
--   - 713/714/715/716（A）分别承载详情/新增/删除/状态接口权限；
--   - 超级管理员（uid=1）自动跳过权限校验并看到所有 M/C 菜单；
--   - 其它角色需要在「角色管理 - 权限设置」里勾选 710~716 后才可访问和操作。
--   前端「新增」按钮还要求 712 已授权，因为它与编辑页共用同一个路由。
--
--   公开页面 / 与 /landing/:slug 不在 /api/ 下，AuthMiddleware 会直接放行，
--   无需改 common/config.ts 的 notLoginUri / notAuthUri。
--
-- 幂等：可重复执行。建表使用 IF NOT EXISTS；菜单行用 ON DUPLICATE KEY UPDATE
--       收敛到目标状态。Redis 角色缓存无需手工清理，下一次请求会自动刷新。
--
-- 注意：sql/install.sql 已同步加入本文件中的建表语句与菜单行。
--       旧环境执行本文件即可；全新环境安装 install.sql 后无需再执行。
--
-- 执行：
--   mysql -h127.0.0.1 -P3307 -uroot -p123456 lm_admin \
--     < sql/migrations/2026-10-23-add-landing-page.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `lm_landing_page` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title` varchar(200) NOT NULL DEFAULT '' COMMENT '页面标题',
  `slug` varchar(100) NOT NULL DEFAULT '' COMMENT '访问别名',
  `subtitle` varchar(300) NOT NULL DEFAULT '' COMMENT '副标题',
  `cover` varchar(255) NOT NULL DEFAULT '' COMMENT '封面图',
  `cta_text` varchar(100) NOT NULL DEFAULT '' COMMENT '按钮文案',
  `cta_link` varchar(500) NOT NULL DEFAULT '' COMMENT '按钮链接',
  `content` mediumtext COMMENT '富文本内容',
  `seo_title` varchar(200) NOT NULL DEFAULT '' COMMENT 'SEO 标题',
  `seo_keywords` varchar(255) NOT NULL DEFAULT '' COMMENT 'SEO 关键词',
  `seo_description` varchar(500) NOT NULL DEFAULT '' COMMENT 'SEO 描述',
  `sort` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '排序，越大越靠前',
  `is_show` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否发布: 0=否, 1=是',
  `is_delete` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除: 0=否, 1=是',
  `create_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `update_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `delete_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_slug` (`slug`) USING BTREE,
  KEY `idx_show_sort` (`is_show`,`is_delete`,`sort`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='落地页表';

INSERT INTO `lm_system_auth_menu`
  (`id`, `pid`, `menu_type`, `menu_name`, `menu_icon`, `menu_sort`, `perms`,
   `paths`, `component`, `selected`, `params`, `is_cache`, `is_show`, `is_disable`,
   `create_time`, `update_time`)
VALUES
  (710, 0, 'M', '官网管理', 'el-icon-Monitor', 42, '',
   'web', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  (711, 710, 'C', '落地页管理', 'el-icon-Document', 0, 'web:landing:list',
   'landing', 'web/landing/index', '', '', 1, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  (712, 710, 'C', '落地页编辑', '', 0, 'web:landing:edit',
   'landing/edit', 'web/landing/edit', '/web/landing', '', 0, 0, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  (713, 711, 'A', '落地页详情', '', 0, 'web:landing:detail',
   '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  (714, 711, 'A', '落地页新增', '', 0, 'web:landing:add',
   '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  (715, 711, 'A', '落地页删除', '', 0, 'web:landing:del',
   '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
  (716, 711, 'A', '落地页状态', '', 0, 'web:landing:change',
   '', '', '', '', 0, 1, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE
  `pid`        = VALUES(`pid`),
  `menu_type`  = VALUES(`menu_type`),
  `menu_name`  = VALUES(`menu_name`),
  `menu_icon`  = VALUES(`menu_icon`),
  `menu_sort`  = VALUES(`menu_sort`),
  `perms`      = VALUES(`perms`),
  `paths`      = VALUES(`paths`),
  `component`  = VALUES(`component`),
  `selected`   = VALUES(`selected`),
  `params`     = VALUES(`params`),
  `is_cache`   = VALUES(`is_cache`),
  `is_show`    = VALUES(`is_show`),
  `is_disable` = VALUES(`is_disable`),
  `update_time` = VALUES(`update_time`);

-- 复核
SHOW TABLES LIKE 'lm_landing_page';
SELECT `id`, `pid`, `menu_type`, `menu_name`, `perms`, `paths`, `component`, `is_show`
FROM `lm_system_auth_menu`
WHERE `id` BETWEEN 710 AND 716
ORDER BY `id`;
