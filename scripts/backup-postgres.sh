#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups/postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required. Set it in $ENV_FILE or the shell environment." >&2
  exit 1
fi

PG_DUMP_URL="$(DATABASE_URL_TO_NORMALIZE="$DATABASE_URL" node - <<'NODE'
const raw = process.env.DATABASE_URL_TO_NORMALIZE;
const url = new URL(raw);
url.searchParams.delete("schema");
process.stdout.write(url.toString());
NODE
)"

PG_DUMP_SCHEMA="$(DATABASE_URL_TO_NORMALIZE="$DATABASE_URL" node - <<'NODE'
const raw = process.env.DATABASE_URL_TO_NORMALIZE;
const url = new URL(raw);
process.stdout.write(url.searchParams.get("schema") || "");
NODE
)"

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$BACKUP_DIR/uzchina_connect_${timestamp}.dump"
temp_file="$backup_file.tmp"
trap 'rm -f "$temp_file"' EXIT

if [[ -n "$PG_DUMP_SCHEMA" ]]; then
  pg_dump --format=custom --no-owner --no-acl --schema "$PG_DUMP_SCHEMA" --file "$temp_file" "$PG_DUMP_URL"
else
  pg_dump --format=custom --no-owner --no-acl --file "$temp_file" "$PG_DUMP_URL"
fi

mv "$temp_file" "$backup_file"

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$backup_file" > "$backup_file.sha256"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$backup_file" > "$backup_file.sha256"
fi

find "$BACKUP_DIR" -type f -name "uzchina_connect_*.dump" -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name "uzchina_connect_*.dump.sha256" -mtime +"$RETENTION_DAYS" -delete

echo "Created PostgreSQL backup: $backup_file"
