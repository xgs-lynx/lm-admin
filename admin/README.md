# admin（前端）

lm_admin 后台管理系统的前端，基于 Vue 3 + Vite 3 + TypeScript + Element Plus + Pinia + Tailwind CSS。

## 开发

```bash
npm install
npm run dev          # 默认 http://localhost:5173
```

接口地址取自 `.env.development` 的 `VITE_APP_BASE_URL`（默认 `http://localhost:8001`），
需与后端 `server/.env` 的 `PORT` 一致。Vite 未配置代理，跨域由后端处理。

## 命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run build` | 构建，产物复制到仓库外的 `../frontend`（见下方说明） |
| `npm run preview` | 预览构建产物，端口 4173 |
| `npm run type-check` | `vue-tsc --noEmit` 类型检查 |
| `npm run lint` | ESLint 检查并自动修复 |

`npm run build` 不是普通的 `vite build`：它执行 `scripts/build.mjs`，先跑 `vite build`，
再把 `dist/` 覆盖复制到 `../frontend` 目录（部署路径，脚本内有"谨慎改动"标注）。
只想验证构建产物时请注意它会删除并重写该目录。

## 环境变量

| 文件 | 用途 |
| --- | --- |
| `.env` | 基础配置（已提交） |
| `.env.development` | 开发环境，被 git 忽略 |
| `.env.production` | 生产环境，被 git 忽略；参考 `.env.production.example` |

## 目录结构

```
src/
├── api/          接口封装，与后端模块对应
├── components/   全局组件（按目录名自动注册）
├── config/       全局配置（baseUrl、urlPrefix、title 等）
├── enums/        枚举（响应码、菜单类型、缓存键）
├── hooks/        组合式函数（usePaging、useDictOptions 等）
├── install/      自动装载的全局指令与插件
├── layout/       布局
├── router/       路由（动态路由由后端菜单下发）
├── stores/       Pinia
├── utils/        request（axios 封装）、auth、cache 等
└── views/        页面
```

## 开发约定

**自动导入 —— 不要手写这些 import：**

- `vue` / `vue-router` 的 API（`ref`、`computed`、`useRouter`…）由 `unplugin-auto-import` 注入。
- Element Plus 组件由 `unplugin-vue-components` 按需注册。
- `src/components/<name>/` 下的组件按目录名自动注册，模板中用 kebab-case，如 `<pagination>`、`<upload>`。
- 生成物 `auto-imports.d.ts`、`components.d.ts`、`.eslintrc-auto-import.json` 由插件生成，已在 `.gitignore` 中忽略，不要手动编辑。

**路由由后端下发：** 登录后根据 `system/menu/route` 返回的菜单树动态生成路由，
用 `import.meta.glob` 按菜单的 `component` 字段匹配 `src/views` 下的 `.vue` 文件。
新增页面需在后端「菜单管理」中配置 `component` 路径，且该路径必须能匹配到实际文件。

**权限控制：** 用 `v-perms="['system:role:add']"` 指令，无权限时该元素会被移出 DOM，
权限串与后端菜单权限串一致。

**页面组织：** 列表页 `index.vue` + 表单弹窗 `edit.vue`（按模块拆目录）。
分页统一用 `hooks/usePaging.ts`，它固定传 `pageNo` / `pageSize` 并读取 `{ count, lists }`。

**代码风格：** ESLint 强制 Prettier —— 4 空格缩进、无分号、单引号、printWidth 100（见 `.eslintrc.cjs`）。

## 相关文档

- 根目录 `README.md` —— 项目总览与接口约定
- 根目录 `CLAUDE.md` —— 前后端架构与开发约定
