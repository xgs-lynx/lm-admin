<div align="center">

# 🐾 Monster Admin · lm_admin

**A decoupled admin system with separated frontend and backend**

Permissions · Organization · Dictionaries · Media Library · WeChat Channels · Page Builder · Bilingual

[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Element Plus](https://img.shields.io/badge/Element_Plus-2.3-409EFF?style=flat-square)](https://element-plus.org/)
[![Pinia](https://img.shields.io/badge/Pinia-2-FFD859?style=flat-square&logo=pinia&logoColor=black)](https://pinia.vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![vue-i18n](https://img.shields.io/badge/vue--i18n-9-42B883?style=flat-square)](https://vue-i18n.intlify.dev/)

[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?style=flat-square&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7+-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](#-license)

[![Homepage](https://img.shields.io/badge/Homepage-about.dancelynx.win-4A5DFF?style=flat-square&logo=aboutdotme&logoColor=white)](https://about.dancelynx.win/)

[简体中文](README.md) | **English**

</div>

---

## ✨ Features

| | Module | Description |
| :---: | --- | --- |
| 🔐 | **Permissions** | Menus / roles / admins in three tiers, with permission strings down to the button level (frontend `v-perms` directive + backend middleware) |
| 🏢 | **Organization** | Departments and posts |
| 📚 | **Dictionaries** | Dictionary types and entries, ready to use via the `useDictOptions` hook |
| 🗂 | **Media Center** | Grouped images / videos with batch move, rename and delete; local upload plus Qiniu Cloud storage |
| 📰 | **Content & Users** | Articles / categories, consumer user list and detail |
| 📱 | **WeChat Channels** | Official account menu and auto-reply, mini program / H5 channel settings |
| 🎨 | **Page Builder** | Drag-and-drop page decoration and bottom tab bar configuration |
| ✉️ | **Notifications** | Announcements and SMS |
| ⚙️ | **System Settings** | Site info / ICP filing / policies, storage settings, system maintenance (env, cache, logs) |
| 📊 | **Workbench** | Shortcuts and data overview |
| 🌏 | **i18n** | Built-in Simplified Chinese / English locale packs with one-click switching |
| 🧩 | **Frontend Conventions** | Auto-registered components, auto-imported APIs, routes driven by backend menus |

## 🛠 Tech Stack

| Part | Stack |
| --- | --- |
| `admin/` frontend | Vue 3 · Vite 3 · TypeScript · Element Plus · Pinia · Tailwind CSS · vue-i18n · ECharts |
| `server/` backend | NestJS 10 · TypeScript · Sequelize 6 (`sequelize-typescript`) · ioredis |
| Storage | MySQL 5.7+ (tables prefixed with `lm_`) + Redis (token / permission cache) |

> The backend was rewritten from the original Egg.js implementation, keeping the **API contract and response shape unchanged**, so frontend and backend can be deployed independently.

## 📁 Project Layout

```
lm_admin
├── admin/            # Frontend (Vue 3)
│   └── src/
│       ├── api/          # API wrappers
│       ├── views/        # Pages
│       ├── components/   # Global components (auto-registered by folder name)
│       ├── locales/      # Chinese / English locale packs
│       ├── stores/       # Pinia
│       └── utils/request # axios wrapper
├── server/           # Backend (NestJS)
│   ├── src/
│   │   ├── common/       # Config, auth middleware, exceptions, utils
│   │   ├── models/       # Sequelize models (mapped to lm_* tables)
│   │   └── modules/      # system / common / setting / monitor
│   └── public/           # Static assets and upload directory
├── sql/install.sql   # Database schema and seed data
├── sql/migrations/   # Incremental migration scripts (run as needed on a fresh env)
└── CLAUDE.md         # Architecture notes and conventions (written for AI assistants, human-readable too)
```

## ⚡ Getting Started

### 1. Initialize the database

```bash
mysql -uroot -p -e "CREATE DATABASE lm_admin DEFAULT CHARSET utf8mb4;"
mysql -uroot -p lm_admin < sql/install.sql
```

### 2. Start the backend

```bash
cd server
cp .env.example .env     # adjust MySQL / Redis connections as needed
npm install
npm run dev              # watch mode, http://127.0.0.1:8001 by default
```

> ⚠️ Starting the server does **not** sync table schemas. To change tables, edit `sql/install.sql` or run the DDL manually.

### 3. Start the frontend

```bash
cd admin
npm install
npm run dev              # http://localhost:5173 by default
```

The API base URL comes from `VITE_APP_BASE_URL` in `admin/.env.development` (defaults to `http://localhost:8001`)
and must match `PORT` in `server/.env`. No Vite proxy is configured — CORS is handled by the backend via `enableCors({ origin: '*' })`.

### 4. Log in

Default account: `admin` / `123456`

## 🌏 Internationalization

The frontend ships with **Simplified Chinese / English** locale packs (`admin/src/locales/lang/`), Chinese by default.
The switcher sits at the top-right of the login page and in the header user dropdown, and the preference is stored in `localStorage`.

It currently covers the framework layer (layout, login page, error pages, shared components, common messages).
Business pages still use Chinese copy; extend the matching namespace under `src/locales/lang/{zh-cn,en}/` to translate them incrementally.

## 🔌 API Contract

All endpoints live under `/api`. **Business failures still return HTTP 200** — the frontend branches on the `code` field only:

```json
{ "code": 200, "data": {}, "message": "请求成功", "msg": "请求成功" }
```

`msg` is equivalent to `message`; both are returned because the frontend interceptor reads `msg`.

| code | Meaning | code | Meaning |
| :---: | --- | :---: | --- |
| 200 | Success | 332 | Empty token |
| 300 | Business failure | 333 | Invalid token |
| 310 | Validation error | 403 | No permission |
| 330 | Wrong account or password | 500 | Server error |
| 331 | Account disabled | | |

## 📦 Build & Deploy

**Backend**

```bash
cd server
npm run build
npm run start:prod       # node dist/main
```

**Frontend**

```bash
cd admin
cp .env.production.example .env.production   # fill in the production API domain
npm run build
```

> `npm run build` in the frontend first runs `vite build`, then copies the output over the `../frontend`
> directory outside this repo (see `admin/scripts/build.mjs` — that path is a deployment convention, change with care).

## 🔑 Permission Model

The backend auth middleware intercepts every `/api/` request, converts the request path into a permission string
(`api/system/admin/self` → `system:admin:self`) and compares it against the menu permission list cached in Redis for that role.
So **after adding an endpoint you must register the matching permission string in Menu Management**, otherwise
non-super-admin requests always get a 403 (alternatively, whitelist it via `notLoginUri` / `notAuthUri` in `server/src/common/config.ts`).

## 📖 Further Reading

- [`CLAUDE.md`](CLAUDE.md) —— architecture, API contract and development conventions (Chinese)
- [`server/README.md`](server/README.md) —— server layout and the "intentional differences from the original Egg.js implementation" list (read before touching related code, Chinese)
- [`admin/README.md`](admin/README.md) —— frontend layout, auto-import and conventions (Chinese)

## 👤 Author

<div align="center">

**DanceLynx**

[![Homepage](https://img.shields.io/badge/Homepage-about.dancelynx.win-4A5DFF?style=for-the-badge&logo=aboutdotme&logoColor=white)](https://about.dancelynx.win/)

</div>

## 📄 License

Released under the [MIT](https://opensource.org/licenses/MIT) license.

<div align="center">

<sub>Made with ❤️ by <a href="https://about.dancelynx.win/">DanceLynx</a></sub>

</div>
