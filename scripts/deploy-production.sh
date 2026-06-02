#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BRANCH="${BRANCH:-main}"
PM2_APP_NAME="${PM2_APP_NAME:-uzchina-connect}"

cd "$APP_DIR"

if [[ ! -f ".env" ]]; then
  echo ".env is required in $APP_DIR before deployment." >&2
  exit 1
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git fetch --prune origin
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

pnpm install --frozen-lockfile
pnpm prisma migrate deploy
pnpm build

if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP_NAME" --update-env
else
  pm2 start "pnpm start" --name "$PM2_APP_NAME" --cwd "$APP_DIR"
fi

pm2 save
pm2 status "$PM2_APP_NAME"
