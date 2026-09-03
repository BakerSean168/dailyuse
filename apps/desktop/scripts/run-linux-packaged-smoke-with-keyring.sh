#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "run-linux-packaged-smoke-with-keyring.sh only supports Linux" >&2
  exit 2
fi
: "${MEMOFLOW_PACKAGED_EXECUTABLE:?MEMOFLOW_PACKAGED_EXECUTABLE must point to the packaged MemoFlow executable}"
for command in dbus-run-session gnome-keyring-daemon gdbus xvfb-run pnpm; do
  command -v "$command" >/dev/null 2>&1 || { echo "Missing required Linux packaged-smoke dependency: $command" >&2; exit 2; }
done

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ephemeral_home="$(mktemp -d)"
cleanup() { rm -rf "$ephemeral_home"; }
trap cleanup EXIT

export MEMOFLOW_PACKAGED_EXECUTABLE
export MEMOFLOW_CI_KEYRING_HOME="$ephemeral_home"
export MEMOFLOW_WORKSPACE_ROOT="$workspace_root"

dbus-run-session -- bash -lc '
  set -euo pipefail
  export HOME="$MEMOFLOW_CI_KEYRING_HOME"
  export XDG_RUNTIME_DIR="$HOME/.runtime"
  export XDG_CURRENT_DESKTOP=GNOME
  export DESKTOP_SESSION=gnome
  export MEMOFLOW_PACKAGED_USE_GNOME_KEYRING=1
  mkdir -p "$HOME/.local/share/keyrings" "$XDG_RUNTIME_DIR"
  chmod 700 "$HOME" "$XDG_RUNTIME_DIR"
  keyring_password="memoflow-ci-ephemeral-$RANDOM-$$"
  printf "%s" "$keyring_password" | gnome-keyring-daemon --unlock --components=secrets >/dev/null
  unset keyring_password
  gdbus introspect --session --dest org.freedesktop.secrets --object-path /org/freedesktop/secrets >/dev/null
  cd "$MEMOFLOW_WORKSPACE_ROOT"
  xvfb-run -a pnpm nx run desktop:test:packaged-smoke --outputStyle=static
'
