# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

`lm_admin`（小怪兽Admin）是一个前后端分离的后台管理系统，仓库根目录下三个独立部分：

- `admin/` — 前端：Vue 3 + Vite 3 + TypeScript + Element Plus + Pinia + Tailwind
- `server/` — 后端：NestJS 10 + Sequelize 6 + MySQL + Redis（由原 Egg.js 实现改写而来，接口契约与前端保持不变）
- `sql/install.sql` — 数据库结构 + 初始数据（MySQL 5.7 dump，含 `lm_` 前缀的全部表）

前后端各自独立安装依赖，没有 workspace/monorepo 工具。

## 常用命令

后端（`server/`）：

```bash
cp .env.example .env    # 首次：配置 MySQL/Redis 连接
npm install
npm run dev             # nest start --watch
npm run build && npm run start:prod
npm run lint            # eslint --fix
npm run format          # prettier 格式化 src/**/*.ts
```

前端（`admin/`）：

```bash
npm install
npm run dev             # vite，默认 5173
npm run build           # 见下方说明
npm run type-check      # vue-tsc --noEmit
npm run lint            # eslint --fix
```

**没有测试框架和测试文件**（两个包都没有 jest/vitest 配置）。验证改动靠启动服务 + 前端手动操作。

**前端 `npm run build` 不是普通的 `vite build`**：它执行 `scripts/build.mjs`，先跑 vite build 再把 `dist/` 覆盖复制到仓库外的 `../frontend` 目录（部署路径，脚本注释标注"谨慎改动"）。只想验证构建产物时注意它会删除并重写 `../frontend`。

数据库初始化：把 `sql/install.sql` 导入 MySQL（库名 `lm_admin`），初始账号 `admin` / `123456`。前端默认连 `http://localhost:8001`（`admin/.env.development` 的 `VITE_APP_BASE_URL`），后端默认监听 8001（`server/.env` 的 `PORT`）。两者必须一致；Vite 没有配置 proxy，跨域靠后端 `enableCors({ origin: '*' })`。

## 接口契约（前后端共同遵守，改动需两侧同步）

所有接口挂在 `/api` 下，**业务失败也返回 HTTP 200**，前端只看响应体的 `code`：

```json
{ "code": 200, "data": {}, "message": "请求成功", "msg": "请求成功" }
```

`msg` 与 `message` 等价，是因为前端拦截器读的是 `msg`。code 含义见 `server/README.md` 表格和 `admin/src/enums/requestEnums.ts`（300 业务失败 / 310 参数校验 / 330 账号密码错误 / 331 禁用 / 332 token 为空 / 333 token 无效 / 403 无权限 / 500 系统错误）。

两个例外：认证中间件拒绝时抛 `HttpException`，走 HTTP 403（body 里仍是 `{code, message, msg}`）；未捕获异常走 HTTP 500。

前端 `admin/src/utils/request/index.ts` 按 code 分支：200 返回 `data`；300/310/403/500 弹错误 toast 并 reject；332/333 清 token 并跳登录页。**default 分支直接返回 `data` 且不提示**——所以后端新增/改动错误码时，必须确认前端 `RequestCodeEnum` 里有对应分支，否则错误会被静默当成成功。

## 后端架构

模块划分在 `server/src/modules/{system,common,setting,monitor}`，每个模块是 controller + `services/`。控制器用 `@Controller('api/system/admin')` 之类的完整前缀，每个方法再写完整子路径（即最终路由 = 两段拼接）。

**认证与权限（最容易踩坑的部分）**：`common/auth/auth.middleware.ts` 挂在 `app.module.ts` 的 `forRoutes('*')`，但内部只处理 `/api/` 开头的请求。它把请求路径转成权限串（`api/system/admin/self` → `system:admin:self`），再和 Redis 中该角色的菜单权限列表比对：

- 新增一个接口后，**必须在数据库/「菜单管理」里配置对应的权限串，否则非超管访问一律 403**。免登录接口写在 `common/config.ts` 的 `notLoginUri`，免权限接口写在 `notAuthUri`，漏配就返回 403。
- `superAdminId = 1` 跳过权限校验但**不**跳过 token 校验。
- 中间件顺带做：token 续签（剩余 < 30 分钟则续到 2 小时）、每次请求刷新角色菜单缓存（`cacheRoleMenusByRoleId`，这是有意为之，用于对齐 `authRole.edit` 事务内写入的旧数据）。

**请求上下文**：Egg 的 `ctx.session` 被替换为 `common/request-context.ts` 里基于 `AsyncLocalStorage` 的 `getRequestContext()`。service/controller 通过它取当前管理员 id、角色、ip、token（键名在 `common/config.ts` 的 `reqAdminIdKey` 等）。它只在中间件里构造，脱离请求链路（如启动脚本）拿不到。

**错误处理**：service 层用 `throw new BusinessException(msg, code)` / `ValidateException`（`common/exceptions/`）表达业务失败；`common/filters/all-exceptions.filter.ts` 统一转成响应体，并把真实错误写进服务端日志。前端能看到的提示语就是 exception 的 message——原 Egg 实现会把提示语吞成 `Internal Server Error`，改写时刻意修正了，别改回去。

**模型与数据库**：`src/models/` 下 24 个 sequelize-typescript 模型对应 `lm_*` 表，经 `models/index.ts` 的 `ALL_MODELS` 由 `database.module.ts` 全局注册。约定：

- 表名 `lm_` 前缀，DB 列 snake_case 用 `field:` 映射，TS 属性 camelCase。
- 时间列在库里是 **int 秒级时间戳**，模型用 `get()` 转成 `YYYY-MM-DD HH:mm:ss` 字符串返回给前端。
- `synchronize: false` / `autoLoadModels: false`：**启动不会同步表结构，改表必须改 `sql/install.sql` 或在数据库里手动执行**。

**Redis**：`redis/redis.service.ts` 封装 ioredis，缓存键前缀与语义集中在 `common/config.ts`（`backstage:token:`、`backstage:manage`、`backstage:roles` 等）。

`server/README.md` 有一份「与原实现的有意差异」表格，逐条记录了改写时修正的原 Egg 缺陷（登录错误码、`await` 漏写、上传文件名截断等）。**动这些位置前先看那张表**，避免把已修的 bug 改回去。

## 前端架构

`admin/src/` 下：`api/`（接口函数）、`views/`（页面）、`components/`（全局组件）、`stores/modules/`（Pinia）、`hooks/`、`utils/request/`（axios 封装）、`install/`（自动注册的全局指令与插件）。

**路由由后端下发**：登录后 `stores/modules/user.ts` 调 `system/menu/route` 拿菜单树，`router/index.ts` 的 `filterAsyncRoutes` 把菜单转成路由，用 `import.meta.glob('/src/views/**/*.vue')` 按菜单的 `component` 字段匹配组件文件。所以**新增页面要在后端菜单管理里配 `component` 路径，且该路径必须能匹配到 `src/views` 下的 `.vue` 文件**，否则报「找不到组件」并 fallback 到空白 `RouterView`。菜单的 `menuType` 决定是目录（`RouterView`/`Layout`）还是页面。

**大量隐式自动导入，不要手写这些 import**：

- `unplugin-auto-import` 自动导入 `vue` / `vue-router` 的 API（`ref`、`computed`、`useRouter`…）。
- `unplugin-vue-components` + `ElementPlusResolver` 自动注册 Element Plus 组件。
- `Components({ directoryAsNamespace: true })` 让 `src/components/<name>/` 自动注册为 `<name>`（kebab-case 使用，如 `<pagination>`、`<upload>`）。
- 生成物 `auto-imports.d.ts` / `components.d.ts` 已被 eslint 忽略，不要手动编辑。

**权限控制**：`v-perms="['system:role:add']"` 指令（`install/directives/perms.ts`）在无权限时直接移除 DOM 元素，权限串就是路由 `meta.perms`，与后端菜单权限串一致。`install/index.ts` 用 `import.meta.glob` 自动装载 `install/directives/` 和 `install/plugins/` 下的模块——新增全局指令/插件只需往对应目录加一个 default export 文件。

**页面约定**：列表页 `index.vue` + 表单弹窗 `edit.vue`（按模块拆目录，如 `views/permission/role/{index,edit,auth}.vue`）。分页统一用 `hooks/usePaging.ts`，它固定向后端传 `pageNo` / `pageSize` 并读取 `{count, lists}`。`api/` 里的函数是薄封装，**POST 也用 `params` 传参**——`utils/request/index.ts` 的 `isParamsToData` 会把 POST 的 params 转成 data。

**代码风格**：`admin/` 由 eslint 强制 prettier：4 空格缩进、无分号、单引号、printWidth 100（见 `.eslintrc.cjs`）。`server/` 用 2 空格缩进 + 分号。两边缩进风格不同是既有的，不要互相"对齐"。
