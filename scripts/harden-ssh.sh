#!/usr/bin/env bash
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
SSH_PORT="${SSH_PORT:-22}"
DISABLE_PASSWORD_AUTH="${DISABLE_PASSWORD_AUTH:-no}"
DISABLE_ROOT_LOGIN="${DISABLE_ROOT_LOGIN:-no}"
PUBLIC_KEY="${DEPLOY_PUBLIC_KEY:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root on the server." >&2
  exit 1
fi

if [[ -z "$PUBLIC_KEY" ]]; then
  echo "DEPLOY_PUBLIC_KEY is required. Example: DEPLOY_PUBLIC_KEY=\"ssh-ed25519 ...\" $0" >&2
  exit 1
fi

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi

usermod -aG sudo "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
printf '%s\n' "$PUBLIC_KEY" > "/home/$DEPLOY_USER/.ssh/authorized_keys"
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

sshd_config="/etc/ssh/sshd_config"
backup="/etc/ssh/sshd_config.bak.$(date -u +%Y%m%dT%H%M%SZ)"
cp "$sshd_config" "$backup"

set_or_append() {
  local key="$1"
  local value="$2"
  if grep -Eq "^[#[:space:]]*$key[[:space:]]+" "$sshd_config"; then
    sed -i -E "s|^[#[:space:]]*$key[[:space:]].*|$key $value|" "$sshd_config"
  else
    printf '%s %s\n' "$key" "$value" >> "$sshd_config"
  fi
}

set_or_append "Port" "$SSH_PORT"
set_or_append "PubkeyAuthentication" "yes"
set_or_append "PermitEmptyPasswords" "no"
set_or_append "X11Forwarding" "no"
set_or_append "MaxAuthTries" "3"

if [[ "$DISABLE_PASSWORD_AUTH" == "yes" ]]; then
  set_or_append "PasswordAuthentication" "no"
fi

if [[ "$DISABLE_ROOT_LOGIN" == "yes" ]]; then
  set_or_append "PermitRootLogin" "no"
else
  set_or_append "PermitRootLogin" "prohibit-password"
fi

sshd -t

if command -v ufw >/dev/null 2>&1; then
  ufw allow "$SSH_PORT/tcp"
  ufw allow 3001/tcp
  ufw --force enable
fi

systemctl restart ssh || systemctl restart sshd

echo "SSH hardening applied."
echo "Deploy user: $DEPLOY_USER"
echo "SSH config backup: $backup"
echo "Before disabling root/password auth, verify a new terminal can SSH as $DEPLOY_USER."
