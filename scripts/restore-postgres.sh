#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
BACKUP_FILE="${1:-}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: CONFIRM_RESTORE=yes $0 /path/to/backup.dump" >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

TARGET_DATABASE_URL="${TARGET_DATABASE_URL:-${DATABASE_URL:-}}"

if [[ -z "$TARGET_DATABASE_URL" ]]; then
  echo "TARGET_DATABASE_URL or DATABASE_URL is required." >&2
  exit 1
fi

PG_RESTORE_URL="$(DATABASE_URL_TO_NORMALIZE="$TARGET_DATABASE_URL" node - <<'NODE'
const raw = process.env.DATABASE_URL_TO_NORMALIZE;
const url = new URL(raw);
url.searchParams.delete("schema");
process.stdout.write(url.toString());
NODE
)"

if [[ "${CONFIRM_RESTORE:-}" != "yes" ]]; then
  echo "Refusing to restore without CONFIRM_RESTORE=yes." >&2
  echo "This command can overwrite data in the target database." >&2
  exit 1
fi

checksum_file="$BACKUP_FILE.sha256"
if [[ -f "$checksum_file" ]]; then
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$(dirname "$BACKUP_FILE")" && sha256sum -c "$(basename "$checksum_file")")
  elif command -v shasum >/dev/null 2>&1; then
    expected="$(awk '{print $1}' "$checksum_file")"
    actual="$(shasum -a 256 "$BACKUP_FILE" | awk '{print $1}')"
    [[ "$expected" == "$actual" ]] || { echo "Checksum mismatch." >&2; exit 1; }
  fi
fi

pg_restore --clean --if-exists --no-owner --no-acl --dbname "$PG_RESTORE_URL" "$BACKUP_FILE"

echo "Restored PostgreSQL backup: $BACKUP_FILE"
