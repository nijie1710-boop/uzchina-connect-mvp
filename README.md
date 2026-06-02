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

pnpm 方式：

```bash
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
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
NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3000"
```

本机如果使用 macOS 默认 PostgreSQL 用户，可以类似：

```env
DATABASE_URL="postgresql://nijie@localhost:5432/uzchina_connect?schema=public"
```

## Seed 账号

- 管理员：`admin@uzchina-connect.com` / `Admin123456`
- 演示用户：`demo@uzchina-connect.com` / `demo123456`
- 资源方：`partner@uzchina-connect.com` / `partner123456`
- 服务商：`service@uzchina-connect.com` / `service123456`

## i18n

i18n 架构在 `src/i18n`：

- `zh-CN` 和 `en` 已完整配置。
- `uz`、`kk`、`ky`、`tg`、`tk`、`ru` 已实现可见语言切换和占位翻译。
- 页面组件通过 `t()` / `tArray()` 读取文案。

## 验证命令

```bash
pnpm lint
pnpm typecheck
pnpm prisma validate
pnpm build
pnpm test:e2e
```

说明：当前工作区路径包含中文，Next 16 的 Turbopack 构建在该路径下会触发路径字符边界 panic，因此 `dev` 和 `build` 脚本显式使用 webpack。

## E2E 测试

项目使用 Playwright 覆盖核心业务闭环。首次运行测试前安装 Chromium：

```bash
pnpm exec playwright install chromium
```

运行：

```bash
pnpm test:e2e
```

E2E 会在开始时执行 `pnpm prisma db seed` 重置本地测试数据，然后验证：

- 普通用户注册和登录
- 普通用户发布资源，新资源默认为 `PENDING`
- `PENDING` 资源不出现在公开资源大厅
- 管理员登录并审核资源为 `APPROVED`
- `APPROVED` 资源出现在资源大厅
- 普通用户申请对接，`MatchRequest` 默认为 `PENDING`
- 管理员审核对接申请为 `CONTACT_UNLOCKED`
- 申请人可以看到联系方式
- 其他普通用户和匿名用户不能看到联系方式
- 普通用户访问 `/admin` 会被拦截
- 管理员可以访问 `/admin`

注意：`pnpm test:e2e` 会重置当前 `DATABASE_URL` 指向的数据库，请只在本地、测试库或 CI 测试库运行，不要直接对生产库运行。

## pnpm build scripts 策略

pnpm 10 默认会阻止依赖包的 install/build scripts，之前安装时可能出现：

```text
Ignored build scripts: @prisma/engines, prisma, sharp, unrs-resolver
```

这些包是当前技术栈的可信构建依赖：

- `@prisma/engines` / `prisma`：Prisma migrate、validate、generate 需要。
- `sharp`：Next.js 图片处理依赖，生产构建或图片优化场景可能用到。
- `unrs-resolver`：解析器的原生构建依赖。

本仓库已通过 `pnpm approve-builds --all` 生成 `pnpm-workspace.yaml`，显式允许上述依赖执行构建脚本。生产服务器部署时优先使用：

```bash
pnpm install --frozen-lockfile
```

如果新环境仍提示 ignored build scripts，先查看列表：

```bash
pnpm ignored-builds
```

确认只包含可信依赖后再执行：

```bash
pnpm approve-builds
```

在无人值守部署中，也可以在确认 lockfile 和依赖来源可信后执行：

```bash
pnpm approve-builds --all
```

不要对未知新增依赖盲目批准 build scripts。

## 新加坡 VPS 生产部署

以下以 Ubuntu 22.04/24.04、域名 `your-domain.com`、应用目录 `/var/www/uzchina-connect-mvp` 为例。

### 1. 安装 Node.js 和 pnpm

```bash
sudo apt update
sudo apt install -y curl ca-certificates git build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
corepack enable
corepack prepare pnpm@10.33.0 --activate
node -v
pnpm -v
```

### 2. 安装并初始化 PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo -u postgres psql
```

在 psql 中创建生产数据库和用户：

```sql
CREATE USER uzchina_app WITH PASSWORD 'replace-with-strong-db-password';
CREATE DATABASE uzchina_connect_prod OWNER uzchina_app;
GRANT ALL PRIVILEGES ON DATABASE uzchina_connect_prod TO uzchina_app;
\q
```

### 3. 拉取代码并配置环境变量

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
git clone https://github.com/nijie1710-boop/uzchina-connect-mvp.git /var/www/uzchina-connect-mvp
cd /var/www/uzchina-connect-mvp
cp .env.example .env
```

编辑 `.env`：

```env
DATABASE_URL="postgresql://uzchina_app:replace-with-strong-db-password@localhost:5432/uzchina_connect_prod?schema=public"
SESSION_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_DEFAULT_LOCALE="zh-CN"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

生成强随机 `SESSION_SECRET`：

```bash
openssl rand -base64 48
```

### 4. 安装依赖、迁移、seed、构建

```bash
pnpm install --frozen-lockfile
pnpm approve-builds
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm build
```

说明：MVP 初次部署可以执行 `pnpm prisma db seed` 创建管理员账号和演示数据。正式上线后，如果不希望重置/覆盖数据，不要在已有生产数据的环境重复执行 seed。

### 5. PM2 启动和开机自启

```bash
sudo npm install -g pm2
pm2 start "pnpm start" --name uzchina-connect --cwd /var/www/uzchina-connect-mvp
pm2 status
pm2 save
pm2 startup systemd
```

`pm2 startup systemd` 会输出一条带 `sudo env PATH=...` 的命令，复制执行一次即可完成开机自启。

常用命令：

```bash
pm2 logs uzchina-connect
pm2 restart uzchina-connect
pm2 stop uzchina-connect
pm2 monit
```

### 6. Nginx 反向代理

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/uzchina-connect
```

写入：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/uzchina-connect /etc/nginx/sites-enabled/uzchina-connect
sudo nginx -t
sudo systemctl reload nginx
```

### 7. HTTPS / Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo certbot renew --dry-run
```

验证：

```bash
curl -I https://your-domain.com
```

### 8. 日志、重启和发布更新

应用日志：

```bash
pm2 logs uzchina-connect
```

Nginx 日志：

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

发布更新：

```bash
cd /var/www/uzchina-connect-mvp
git pull
pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm build
pm2 restart uzchina-connect
```

### 9. 数据库备份和恢复

创建备份目录：

```bash
mkdir -p ~/backups/uzchina-connect
```

备份：

```bash
pg_dump -h localhost -U uzchina_app -Fc uzchina_connect_prod > ~/backups/uzchina-connect/uzchina_$(date +%F_%H%M).dump
```

恢复到空库：

```bash
pg_restore -h localhost -U uzchina_app -d uzchina_connect_prod --clean --if-exists ~/backups/uzchina-connect/backup-file.dump
```

### 10. 回滚说明

代码回滚：

```bash
cd /var/www/uzchina-connect-mvp
git fetch
git log --oneline -n 10
git checkout <safe_commit_sha>
pnpm install --frozen-lockfile
pnpm build
pm2 restart uzchina-connect
```

数据库迁移不建议手工逆向回滚。若发布包含破坏性 migration，应先备份；需要回滚数据库时，用最近一次 `pg_dump` 备份恢复到新库或维护窗口内恢复原库。

## Production Checklist

- `pnpm install --frozen-lockfile` 成功。
- `pnpm approve-builds` 或仓库 `pnpm-workspace.yaml` 的 build scripts 策略已处理。
- `pnpm prisma migrate deploy` 成功。
- 初次部署需要 seed 时，`pnpm prisma db seed` 成功。
- `pnpm build` 成功。
- PM2 进程 `uzchina-connect` 正常。
- Nginx 反向代理正常。
- HTTPS 证书正常。
- admin 账号可以登录。
- 普通用户可以注册/登录。
- 发布资源 → 后台审核 → 资源大厅展示 → 申请对接 → 后台开放联系方式完整闭环正常。
- 非授权用户看不到联系方式。
- `/admin` 权限隔离正常。

## 暂未接入

- 真实支付
- 资金托管
- 短信验证码
- Telegram OAuth
- Google OAuth
- 真实文件上传存储
