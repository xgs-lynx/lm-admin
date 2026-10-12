# lm_admin（小怪兽Admin）

前后端分离的后台管理系统，包含权限管理、部门/岗位、字典、素材库、网站设置等模块。

服务端由原 Egg.js 实现改写为 NestJS，**接口契约与响应结构保持不变**，可继续对接 `admin/` 前端。

## 技术栈

| 端 | 技术 |
| --- | --- |
| `admin/` | Vue 3 + Vite 3 + TypeScript + Element Plus + Pinia + Tailwind CSS |
| `server/` | NestJS 10 + TypeScript + Sequelize 6（`sequelize-typescript`） |
| 存储 | MySQL（`lm_` 前缀表）+ Redis（token / 权限缓存） |

## 目录结构

```
.
├── admin/            # 前端
│   └── src/
│       ├── api/          # 接口封装
│       ├── views/        # 页面
│       ├── components/   # 全局组件（自动注册）
│       ├── stores/       # Pinia
│       └── utils/request # axios 封装
├── server/           # 后端
│   ├── src/
│   │   ├── common/       # 配置、认证中间件、异常、工具
│   │   ├── models/       # Sequelize 模型（对应 lm_* 表）
│   │   └── modules/      # system / common / setting / monitor
│   └── public/           # 静态资源与上传目录
├── sql/install.sql   # 数据库结构与初始数据
└── CLAUDE.md         # 架构说明与开发约定（面向 AI 助手，同样适合人类阅读）
```

## 环境要求

- Node.js >= 18（后端 `engines` 约束）
- MySQL 5.7+
- Redis

## 快速开始

### 1. 初始化数据库

```bash
mysql -uroot -p -e "CREATE DATABASE lm_admin DEFAULT CHARSET utf8mb4;"
mysql -uroot -p lm_admin < sql/install.sql
```

### 2. 启动后端

```bash
cd server
cp .env.example .env     # 按需修改 MySQL / Redis 连接
npm install
npm run dev              # watch 模式，默认 http://127.0.0.1:8001
```

> 注意：启动**不会**自动同步表结构，改表需要修改 `sql/install.sql` 或在数据库中手动执行。

### 3. 启动前端

```bash
cd admin
npm install
npm run dev              # 默认 http://localhost:5173
```

前端的接口地址来自 `admin/.env.development` 的 `VITE_APP_BASE_URL`（默认 `http://localhost:8001`），
需与后端 `.env` 的 `PORT` 一致。Vite 未配置代理，跨域由后端 `enableCors({ origin: '*' })` 处理。

### 4. 登录

初始账号：`admin` / `123456`

## 接口约定

所有接口挂在 `/api` 下，**业务失败也返回 HTTP 200**，前端只按响应体的 `code` 分支处理：

```json
{ "code": 200, "data": {}, "message": "请求成功", "msg": "请求成功" }
```

`msg` 与 `message` 等价，为兼容前端拦截器（其读取的是 `msg`）而同时输出。

| code | 说明 |
| --- | --- |
| 200 | 成功 |
| 300 | 业务失败 |
| 310 | 参数校验错误 |
| 330 | 账号或密码错误 |
| 331 | 账号已被禁用 |
| 332 | token 参数为空 |
| 333 | token 参数无效 |
| 403 | 无相关权限 |
| 500 | 系统错误 |

## 构建部署

**后端**：

```bash
cd server
npm run build
npm run start:prod       # node dist/main
```

**前端**：

```bash
cd admin
cp .env.production.example .env.production   # 填入生产环境接口域名
npm run build
```

前端的 `npm run build` 会先执行 `vite build`，再把产物覆盖复制到仓库外的 `../frontend` 目录
（见 `admin/scripts/build.mjs`，路径为部署约定，修改需谨慎）。

## 权限模型

后端认证中间件会拦截所有 `/api/` 请求，把请求路径转换为权限串（`api/system/admin/self` → `system:admin:self`），
与该角色在 Redis 中缓存的菜单权限列表比对。因此**新增接口后必须在「菜单管理」中配置对应权限串**，
否则非超管访问一律返回 403（也可将其加入 `server/src/common/config.ts` 的 `notLoginUri` / `notAuthUri`）。

## 更多文档

- `CLAUDE.md` —— 前后端架构、接口契约与开发约定的完整说明
- `server/README.md` —— 服务端目录结构与「与原 Egg 实现的有意差异」清单（改动相关代码前请先阅读）
