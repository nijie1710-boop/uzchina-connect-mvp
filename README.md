# UzChina Connect MVP

UzChina Connect 第一版 MVP 网站，基于提供的 HTML 原型实现。前台、用户中心和管理员后台在同一个 Next.js 项目中，已接入 PostgreSQL、Prisma、邮箱密码登录和后台审核闭环。

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS
- Prisma 7 + PostgreSQL
- 自研邮箱密码登录：签名 httpOnly cookie session
- Server Actions：资源、需求、许可证合作、对接申请和后台审核

## 已实现页面

- `/` 首页
- `/resources` 资源大厅
- `/resources/[id]` 资源详情
- `/submit-resource` 发布资源
- `/submit-demand` 提交需求
- `/license-cooperation` 许可证合作
- `/login` 登录
- `/register` 注册
- `/dashboard` 用户中心
- `/admin` 管理员后台

## 真实业务闭环

1. 用户注册/登录后，在 `/submit-resource` 发布资源，资源进入 `pending`。
2. 管理员在 `/admin` 审核资源，通过或推荐后，资源才会在 `/resources` 展示。
3. 资源联系方式默认隐藏。
4. 登录用户在资源详情页申请对接，生成 `MatchRequest`，状态为 `pending`。
5. 管理员审核对接申请，选择“通过并开放”后，状态变为 `contact_unlocked`。
6. 申请人再次进入资源详情页，可以看到联系方式。
7. 资源、需求、对接、许可证合作等审核动作都会写入 `AdminAuditLog`。

## 数据库

Prisma schema 位于 `prisma/schema.prisma`，包含：

- `User`
- `Resource`
- `Demand`
- `MatchRequest`
- `LicenseApplication`
- `Verification`
- `AdminAuditLog`
- `UploadFile`

初始迁移在 `prisma/migrations/20260601000000_init/migration.sql`。

## 本地启动

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

默认地址：

```bash
http://127.0.0.1:3000
```

## 环境变量

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/uzchina_connect?schema=public"
SESSION_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_DEFAULT_LOCALE="zh-CN"
```

本机如果使用 macOS 默认 PostgreSQL 用户，可以类似：

```env
DATABASE_URL="postgresql://nijie@localhost:5432/uzchina_connect?schema=public"
```

## Seed 账号

- 管理员：`admin@uzchina-connect.com` / `admin123456`
- 演示用户：`demo@uzchina-connect.com` / `demo123456`
- 资源方：`partner@uzchina-connect.com` / `partner123456`

## i18n

i18n 架构在 `src/i18n`：

- `zh-CN` 和 `en` 已完整配置。
- `uz`、`kk`、`ky`、`tg`、`tk`、`ru` 已实现可见语言切换和占位翻译。
- 页面组件通过 `t()` / `tArray()` 读取文案。

## 验证命令

```bash
npm run lint
npx prisma validate
npm run build
```

说明：当前工作区路径包含中文，Next 16 的 Turbopack 构建在该路径下会触发路径字符边界 panic，因此 `dev` 和 `build` 脚本显式使用 webpack。

## 暂未接入

- 真实支付
- 资金托管
- 短信验证码
- Telegram OAuth
- Google OAuth
- 真实文件上传存储
