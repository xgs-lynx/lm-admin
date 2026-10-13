-- ---------------------------------------------------------------------------
-- 迁移：C 端用户体系（/api/client/*）—— 索引
--
-- 背景：新增 C 端账号密码注册登录 + 个人信息 + 文章收藏，涉及两张表加索引。
--
-- 1) lm_user.username / lm_user.mobile 加【非唯一】索引
--    注册的唯一性检查、登录的账号查询都是这两列上的等值查询，
--    而 lm_user 除主键外没有任何索引（见 sql/install.sql 中该表的 DDL）。
--
--    为什么不用唯一索引：用户被软删（is_delete=1）后应允许同名重新注册，
--    而 MySQL 5.7 不支持部分/条件唯一索引，加了唯一索引会把这条路永久堵死。
--    注册唯一性由业务层「先查后插」保证（与后台 lm_system_auth_admin 的既有做法一致），
--    代价是存在极小的并发重名窗口，明确接受。
--
-- 2) lm_article_collect(user_id, article_id) 加【唯一】索引
--    收藏的防重依赖「先查后插 + 软删复活 + 唯一索引兜底」。
--    业务上「一个用户对一篇文章永远只有一行」——取消收藏是 is_delete 置 1，
--    再次收藏是复活同一行（永不插第二行），因此唯一索引与软删语义不冲突。
--    没有它，移动端双击 / 网络重试造成的并发插入会留下重复行，
--    后续 update 会一次改到多行，收藏列表出现重复条目。
--
-- 幂等：可重复执行。MySQL 5.7 不支持 ADD INDEX IF NOT EXISTS，
--       这里查 information_schema 后动态拼 DDL（已存在则执行 DO 0 空操作）。
--
-- 前置：lm_user 与 lm_article_collect 当前均为空表（install.sql 中只有建表语句、
--       无数据行），加唯一索引不会因存量重复数据而失败。
--
-- 注意：sql/install.sql 未被修改，因此全新环境导入 install.sql 后需额外执行本文件。
--
-- 执行：
--   mysql -h127.0.0.1 -P3307 -uroot -p lm_admin \
--     < sql/migrations/2026-10-13-add-client-user-and-collect-indexes.sql
-- ---------------------------------------------------------------------------

-- 1) lm_user.username
SET @ddl := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `lm_user` ADD INDEX `idx_username` (`username`)', 'DO 0')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'lm_user' AND index_name = 'idx_username');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) lm_user.mobile
SET @ddl := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `lm_user` ADD INDEX `idx_mobile` (`mobile`)', 'DO 0')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'lm_user' AND index_name = 'idx_mobile');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) lm_article_collect 防重唯一索引
SET @ddl := (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `lm_article_collect` ADD UNIQUE KEY `uk_user_article` (`user_id`,`article_id`)', 'DO 0')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'lm_article_collect' AND index_name = 'uk_user_article');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) 复核
SHOW INDEX FROM `lm_user` WHERE Key_name IN ('idx_username', 'idx_mobile');
SHOW INDEX FROM `lm_article_collect` WHERE Key_name = 'uk_user_article';
