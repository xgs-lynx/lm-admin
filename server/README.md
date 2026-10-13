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
| `storageService.edit` 的 status 语义 | `status===1` 时置 `default=alias`，否则**无条件**置 `default=''` | 仅当 `default===alias` 时才清空 | 只有本地存储时该缺陷不显形；接入第二个引擎后，七牛云生效时打开「本地存储」弹窗（status 回填为 0）直接保存会把两个引擎全关掉 |
| `storageService` 的引擎支持 | 硬编码 `const engine = 'local'`，`list` 只返回本地一行，其余 alias 一律抛 `engine:xxx 暂时不支持`（且被 catch 成一句 `Edit Set default err`） | 支持 `local` / `qiniu`，错误提示可读 | 同上 |
| `urlUtil.toRelativeUrl` 入参 | 无条件 `new URL(u)`，传入相对值抛 `Invalid URL` 打断保存流程 | 非绝对地址原样返回 | 七牛云下存的就是对象 key，是相对标识 |
| `urlUtil.toAbsoluteUrl` 入参 | 已是完整 URL 时仍按相对路径拼接，得到 `http://host/http:/x` 这类坏值 | 绝对地址直通 | 同上 |

### 存储引擎

支持 **本地存储** 与 **七牛云存储**，在「系统设置 → 存储设置」切换。当前生效引擎记录在
`lm_system_config`（`type='storage'`, `name='default'`），各引擎配置存在同表的同名行里。

**本地存储是系统兜底，不可关闭**：它不参与 `default` 的竞争，`default` 为空或 `'local'`
都表示「未启用任何云存储」，此时走本地存储。因此：

- 任何时刻**至多只有一行显示「开启」** —— 没有云存储启用时是本地存储，启用云存储后是那个云存储，
  本地存储随之显示「关闭」；
- 想从云存储切回本地，请**把云存储关掉**，而不是去"开启本地存储"（本地存储的配置弹窗里状态单选是置灰的，
  保存它的配置不会影响 `default`）；
- 本地存储的 `status` 由当前生效引擎推导而来，不接受直接修改：`storage/change` 关闭本地存储会被明确拒绝。

引擎信息由 `common/storage-context.ts` 维护为**进程内快照**，由 `StorageService.onModuleInit`
在启动时、以及每次保存配置后刷新。`url.util.ts` 等同步读取该快照，因此：

- **修改配置立即生效**，无需重启；
- 直接手改数据库或**多进程部署**时，其他进程需重启才能感知；
- `default` 指向未实现的引擎（`aliyun` / `qcloud`）、或七牛云配置不完整时，一律**回落本地存储**并打 `warn`。

七牛云上传的注意点：

- 空间域名必须带 `http://` 或 `https://`（否则拼出来的是相对地址，图片会静默失效），末尾斜杠会被自动去掉；
- 上传使用 `qiniu` SDK，`useHttpsDomain` 已显式开启（该选项默认为 `false`，会导致区域查询与上传走 http）；
- 上传失败**不会**写入 `lm_album`，只会在服务端日志留下 `qiniu upload failed: ...`；
- 七牛对象 key 形如 `image/YYYY-MM-DD/<uuid><ext>`，不只是为了防重名 —— 该 key 不能以 `/` 开头、不能包含 `public/uploads/`，否则会被 `url.util` 当成本地路径解析。

### 已知的既有问题

另外，上传白名单（`MULTIPART.whitelist`，来自原 `config.multipart.whitelist`）为
`.txt .png .jpeg .jpg .zip .xls .ppt .doc .docx .pdf .xlsx .mp4 .wmv .avi .mov .flv .rmvb`，
而前端 `components/upload/index.vue` 的 `accept` 允许 `.gif .ico .bmp`。选择这三类文件会被后端以
`Invalid file type` 拒绝。该不一致为原实现既有问题，因涉及放行范围未擅自放宽，如需支持请显式加入白名单。

另外，素材删除（`albumService.albumDel`）只做软删除（置 `is_delete=1`），**不会**删除本地磁盘文件或
七牛云上的对象；而前端删除确认文案声称「本地或云存储文件也将同步删除」。该不一致为原实现既有问题，
涉及不可逆的远端删除操作，未擅自补齐。

## 说明

- 数据库表名为 `lm_` 前缀（`dbTablePrefix`），与原仓库 `sql/install.sql` 的导入结果一致。
- 启动时**不会**自动同步表结构（原实现会执行 `model.sync({})`）。
