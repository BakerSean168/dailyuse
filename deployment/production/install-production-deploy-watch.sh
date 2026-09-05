#!/usr/bin/env bash
set -Eeuo pipefail
SOURCE_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CONFIG_DIR=${MEMOFLOW_PRODUCTION_CONFIG_DIR:-/etc/memoflow}
CONFIG_FILE=${MEMOFLOW_PRODUCTION_CHANNEL_CONFIG:-$CONFIG_DIR/production-channel.env}
SECRET_ENV=${MEMOFLOW_PRODUCTION_SECRET_ENV:-/opt/memoflow/.env.production.local}
BIN_PATH=${MEMOFLOW_PRODUCTION_BIN_PATH:-/usr/local/bin/memoflow-production-deploy-watch}
SYSTEMD_DIR=${MEMOFLOW_PRODUCTION_SYSTEMD_DIR:-/etc/systemd/system}

[[ $(id -u) -eq 0 ]] || { echo 'production watcher installer must run as root' >&2; exit 2; }
for required in production-deploy-watch.sh systemd/memoflow-production-deploy-watch.service systemd/memoflow-production-deploy-watch.timer; do
  [[ -s "$SOURCE_DIR/$required" ]] || { echo "production control bundle missing: $required" >&2; exit 2; }
done
for command in docker jq sha256sum gzip curl flock systemctl; do
  command -v "$command" >/dev/null 2>&1 || { echo "missing required command: $command" >&2; exit 2; }
done
docker compose version >/dev/null
[[ -s "$SECRET_ENV" ]] || { echo "missing production secret env: $SECRET_ENV" >&2; exit 2; }

read_env_key() {
  local key="$1"
  sed -n "s/^${key}=//p" "$SECRET_ENV" | tail -1
}
registry=${PRODUCTION_REGISTRY:-$(read_env_key REGISTRY)}
namespace=${PRODUCTION_NAMESPACE:-$(read_env_key IMAGE_NAMESPACE)}
[[ -n "$registry" && -n "$namespace" ]] || { echo 'unable to resolve production ACR registry/namespace' >&2; exit 2; }

mkdir -p "$CONFIG_DIR" "$SYSTEMD_DIR"
chmod 0755 "$CONFIG_DIR"
if [[ ! -e "$CONFIG_FILE" ]]; then
  umask 077
  cat > "$CONFIG_FILE" <<ENV
# Non-secret coordinates for MemoFlow canonical Alibaba production delivery.
PRODUCTION_REGISTRY=$registry
PRODUCTION_NAMESPACE=$namespace
PRODUCTION_CHANNEL_TAG=production-selected
PRODUCTION_SECRET_ENV=$SECRET_ENV
PRODUCTION_COMPOSE_PROJECT=memoflow
# Canonical HTTPS routes: the watcher probes these through local Caddy with
# --resolve to 127.0.0.1; public reachability is verified out-of-band.
PRODUCTION_EXTERNAL_WEB_URL=https://memoflow.bakersean.top/
PRODUCTION_EXTERNAL_API_URL=https://memoflowapi.bakersean.top/healthz
PRODUCTION_EXTERNAL_POWERSYNC_URL=https://memoflowsync.bakersean.top/probes/liveness
ENV
  chmod 0600 "$CONFIG_FILE"
  echo "created production channel config: $CONFIG_FILE"
else
  echo "preserving existing production channel config: $CONFIG_FILE"
fi

install -m 0755 "$SOURCE_DIR/production-deploy-watch.sh" "$BIN_PATH"
install -m 0644 "$SOURCE_DIR/systemd/memoflow-production-deploy-watch.service" "$SYSTEMD_DIR/memoflow-production-deploy-watch.service"
install -m 0644 "$SOURCE_DIR/systemd/memoflow-production-deploy-watch.timer" "$SYSTEMD_DIR/memoflow-production-deploy-watch.timer"
systemctl daemon-reload

case "${1:-}" in
  '')
    echo "preflight: $BIN_PATH --check-only"
    echo "controlled rollout: systemctl start memoflow-production-deploy-watch.service"
    echo "enable after acceptance: $0 --enable"
    ;;
  --enable)
    "$BIN_PATH" --check-only
    systemctl enable --now memoflow-production-deploy-watch.timer
    ;;
  *) echo "unknown argument: $1" >&2; exit 2 ;;
esac
