# lm_admin 服务端（小怪兽Admin · NestJS）

由原 `server/`（Egg.js + egg-sequelize）后端改写而来的 NestJS 版本，接口与响应结构与原实现保持一致，
可直接对接 `admin/` 前端。

- 框架：NestJS 10 + TypeScript
- ORM：Sequelize 6（`@nestjs/sequelize` + `sequelize-typescript`）
- 数据库：MySQL `lm_admin`
- 缓存：Redis（ioredis）

## 快速开始

```bash
cp .env.example .env   # 按需修改数据库/Redis 连接
npm install
npm run dev            # 开发模式（watch）
# 或
npm run build && npm run start:prod
```

默认监听 `http://127.0.0.1:8001`，与前端 `admin/.env.development` 中的 `VITE_APP_BASE_URL` 一致。

初始账号：`admin` / `123456`

## 目录结构

```
src/
├── main.ts                     启动入口（/public 静态资源、CORS、全局异常过滤器）
├── app.module.ts               根模块（Sequelize/Redis/业务模块注册、认证中间件挂载）
├── database.module.ts          全局模型注册
├── common/
│   ├── config.ts               移植自 app/extend/config.js
│   ├── result.ts               响应体 {code,data,message,msg}
│   ├── request-context.ts      请求级会话（等价于原 ctx.session）
│   ├── auth/auth.middleware.ts token 认证 + 角色权限（移植自 app/middleware/auth.js）
│   ├── exceptions/             业务异常
│   ├── filters/                全局异常过滤器
│   └── utils/                  index / urlUtil / server / token
├── redis/                      Redis 服务（移植自 app/service/redis.js）
├── models/                     24 个 Sequelize 模型（对应 lm_* 表）
└── modules/
    ├── system/                 login/logout/menu route/console/config、admin、dept、post、role、menu、log
    ├── common/                 素材（album）与上传
    ├── setting/                website / copyright / protocol / storage / dict
    └── monitor/                server / cache
public/                         静态资源（/public 前缀）与上传目录
```

## 接口约定

响应体统一为：

```json
{ "code": 200, "data": {}, "message": "请求成功", "msg": "请求成功" }
```

`msg` 为兼容前端 `request` 拦截器（其读取的是 `msg` 字段）而额外输出，与 `message` 等价。

状态码：

| code | 说明 |
| --- | --- |
| 200 | 成功 |
| 300 | 业务失败 |
| 310 | 参数校验错误 |
| 330 | 账号或密码错误 |
| 331 | 账号已被禁用 |
| 332 | token 参数为空 |
| 333 | token 参数无效 / 用户被删除 |
| 403 | 无相关权限 |
| 500 | 系统错误 |

## 与原实现的有意差异

以下位置修正了原实现中明显无法生效的缺陷（接口契约未变）：

| 位置 | 原实现 | 现实现 | 原因 |
| --- | --- | --- | --- |
| 登录失败返回码 | `1002` | `330` / `331` | 前端 `RequestCodeEnum` 只识别 330/331；原 `1002` 落到 `default` 分支会被当作成功 |
| 业务异常提示语 | 被 catch 后统一返回纯文本 `Internal Server Error` | 返回原提示语 | 原实现把 `账号已存在换一个吧！` 等提示全部吞掉，前端无法展示 |
| `middleware/auth.js` 禁用/删除校验 | 读取 `is_delete` / `is_disable`，与缓存中的 camelCase 键不符，校验从未生效 | 兼容两种键名 | 使 331/333 两个已接入前端的错误码真正生效 |
| `authAdmin.disable` / `del` | 不刷新登录缓存，禁用/删除后旧 token 仍可用 | 更新后刷新缓存 | 同上 |
| 角色菜单缓存 | `hExists` 漏写 `await`（Promise 恒为真），实际每次请求都重刷缓存 | 显式每次刷新 | 该行为是必要的：`authRole.edit` 在事务内写缓存，读到的是未提交的旧数据，需靠后续请求刷新完成最终一致 |
| 登录单点登录判断 | `redis.sGet` 漏写 `await`，踢出旧 token 的分支从不执行 | 正确 await | — |
| `redis.sSet(key, token)` | 仅写入 `values[0]`，传字符串时只存首字符 | 支持字符串与数组 | — |
| `authDept.del` 顶级部门校验 | `dept.Pid` 拼写错误，校验从不生效 | 移除该死代码分支 | — |
| `authRole.detail` | `ctx.response.CheckErrDBNotRecord` 不存在，必然抛 TypeError | 抛出业务异常 | — |
| `authAdmin.adminList` | `adminResp[i].dept.name` 在部门为空时抛错，导致整个列表 500 | 空值返回 `''` | — |
| 上传原始文件名过长 | 原样写入 `lm_album.name`（`varchar(100)`），文件名超过 100 字符即 `Data too long for column 'name'`，上传整体失败 | 按 100 字符截断并保留扩展名 | `name` 列长度由导入的 SQL 决定，不擅自改表结构 |
| 上传失败原因 | 被 catch 成一句 `AlbumAdd Create err`，数据库真实报错完全丢失 | 真实错误写入服务端日志，对外提示不变 | 否则此类问题无法排查 |

### 已知的既有问题

另外，上传白名单（`MULTIPART.whitelist`，来自原 `config.multipart.whitelist`）为
`.txt .png .jpeg .jpg .zip .xls .ppt .doc .docx .pdf .xlsx .mp4 .wmv .avi .mov .flv .rmvb`，
而前端 `components/upload/index.vue` 的 `accept` 允许 `.gif .ico .bmp`。选择这三类文件会被后端以
`Invalid file type` 拒绝。该不一致为原实现既有问题，因涉及放行范围未擅自放宽，如需支持请显式加入白名单。

## 说明

- 数据库表名为 `lm_` 前缀（`dbTablePrefix`），与原仓库 `sql/install.sql` 的导入结果一致。
- 启动时**不会**自动同步表结构（原实现会执行 `model.sync({})`）。
