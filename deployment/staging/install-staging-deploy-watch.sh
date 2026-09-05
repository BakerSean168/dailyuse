#!/usr/bin/env bash
set -Eeuo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
CONFIG_DIR=${MEMOFLOW_STAGING_CONFIG_DIR:-$HOME/.config/memoflow}
CONFIG_FILE=${MEMOFLOW_STAGING_CHANNEL_CONFIG:-$CONFIG_DIR/staging-channel.env}
BIN_DIR=${MEMOFLOW_STAGING_BIN_DIR:-$HOME/.local/bin}
SYSTEMD_DIR=${MEMOFLOW_STAGING_SYSTEMD_DIR:-$HOME/.config/systemd/user}
DEFAULT_SECRET_ENV=${MEMOFLOW_STAGING_SECRET_ENV:-$CONFIG_DIR/staging.env}
distribution=${STAGING_DISTRIBUTION:-global}
case "$distribution" in
  global)
    registry=${STAGING_REGISTRY:-ghcr.io}
    if [[ -n "${STAGING_NAMESPACE:-}" ]]; then
      namespace=$STAGING_NAMESPACE
    else
      origin=$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)
      namespace=$(printf '%s\n' "$origin" | sed -E 's#^git@github.com:([^/]+)/.*#\1#; s#^https://github.com/([^/]+)/.*#\1#' | tr '[:upper:]' '[:lower:]')
    fi
    ;;
  china)
    registry=${STAGING_REGISTRY:-}
    namespace=${STAGING_NAMESPACE:-}
    ;;
  *) echo 'STAGING_DISTRIBUTION must be global or china' >&2; exit 2 ;;
esac
[[ -n "$registry" && -n "$namespace" ]] || { echo 'unable to resolve staging registry/namespace; set STAGING_REGISTRY and STAGING_NAMESPACE' >&2; exit 2; }
mirror_tag() { node -e "const c=require('$ROOT/tools/ci-cd-platform/runtime-image-mirrors.json');const x=c.images.find((i)=>i.name===process.argv[1]);if(!x)process.exit(2);process.stdout.write(x.tag)" "$1"; }
mkdir -p "$CONFIG_DIR" "$BIN_DIR" "$SYSTEMD_DIR"
if [[ ! -e "$CONFIG_FILE" ]]; then
  umask 077
  cat > "$CONFIG_FILE" <<ENV
# Non-secret coordinates for MemoFlow canonical staging.
STAGING_REGISTRY=$registry
STAGING_NAMESPACE=$namespace
STAGING_DISTRIBUTION=$distribution
STAGING_CHANNEL_TAG=staging-latest
STAGING_SECRET_ENV=$DEFAULT_SECRET_ENV
STAGING_COMPOSE_PROJECT=memoflow-staging
STAGING_POSTGRES_IMAGE=$registry/$namespace/memoflow-postgres:$(mirror_tag memoflow-postgres)
STAGING_REDIS_IMAGE=$registry/$namespace/memoflow-redis:$(mirror_tag memoflow-redis)
STAGING_POWERSYNC_IMAGE=$registry/$namespace/memoflow-powersync:$(mirror_tag memoflow-powersync)
STAGING_EXTERNAL_WEB_URL=https://gcp-dev-01.taile92a8e.ts.net:20250/
STAGING_EXTERNAL_API_URL=https://gcp-dev-01.taile92a8e.ts.net:20251/healthz
STAGING_EXTERNAL_POWERSYNC_URL=https://gcp-dev-01.taile92a8e.ts.net:20252/probes/liveness
ENV
  chmod 0600 "$CONFIG_FILE"
  echo "created staging channel config: $CONFIG_FILE"
else
  echo "preserving existing staging channel config: $CONFIG_FILE"
fi
[[ -s "$DEFAULT_SECRET_ENV" || -s "$(sed -n 's/^STAGING_SECRET_ENV=//p' "$CONFIG_FILE" | tail -1)" ]] || { echo 'missing staging secret env' >&2; exit 2; }
install -m 0755 "$ROOT/deployment/staging/staging-deploy-watch.sh" "$BIN_DIR/memoflow-staging-deploy-watch"
install -m 0644 "$ROOT/deployment/staging/systemd/memoflow-staging-deploy-watch.service" "$SYSTEMD_DIR/memoflow-staging-deploy-watch.service"
install -m 0644 "$ROOT/deployment/staging/systemd/memoflow-staging-deploy-watch.timer" "$SYSTEMD_DIR/memoflow-staging-deploy-watch.timer"
systemctl --user daemon-reload
if [[ "${1:-}" == '--enable' ]]; then
  "$BIN_DIR/memoflow-staging-deploy-watch" --check-only
  systemctl --user enable --now memoflow-staging-deploy-watch.timer
else
  echo "preflight: $BIN_DIR/memoflow-staging-deploy-watch --check-only"
  echo "enable:   $0 --enable"
fi
