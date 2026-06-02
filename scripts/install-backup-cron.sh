#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/uzchina-connect-mvp}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/uzchina-connect}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
CRON_FILE="${CRON_FILE:-/etc/cron.d/uzchina-connect-backup}"
LOG_FILE="${LOG_FILE:-/var/log/uzchina-connect-backup.log}"
CRON_SCHEDULE="${CRON_SCHEDULE:-15 3 * * *}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root because this script writes $CRON_FILE and $BACKUP_DIR." >&2
  exit 1
fi

if [[ ! -x "$APP_DIR/scripts/backup-postgres.sh" ]]; then
  echo "Backup script not found or not executable: $APP_DIR/scripts/backup-postgres.sh" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
touch "$LOG_FILE"
chmod 750 "$BACKUP_DIR"
chmod 640 "$LOG_FILE"

cat > "$CRON_FILE" <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
$CRON_SCHEDULE root APP_DIR=$APP_DIR BACKUP_DIR=$BACKUP_DIR BACKUP_RETENTION_DAYS=$RETENTION_DAYS $APP_DIR/scripts/backup-postgres.sh >> $LOG_FILE 2>&1
EOF

chmod 644 "$CRON_FILE"
systemctl restart cron

"$APP_DIR/scripts/backup-postgres.sh"

echo "Installed daily PostgreSQL backup cron: $CRON_FILE"
echo "Backup directory: $BACKUP_DIR"
echo "Log file: $LOG_FILE"
