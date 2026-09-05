#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "run-linux-packaged-smoke-with-keyring.sh only supports Linux" >&2
  exit 2
fi
: "${MEMOFLOW_PACKAGED_EXECUTABLE:?MEMOFLOW_PACKAGED_EXECUTABLE must point to the packaged MemoFlow executable}"
for command in dbus-run-session gnome-keyring-daemon gdbus secret-tool timeout xvfb-run pnpm; do
  command -v "$command" >/dev/null 2>&1 || { echo "Missing required Linux packaged-smoke dependency: $command" >&2; exit 2; }
done

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ephemeral_home="$(mktemp -d)"
cleanup() { rm -rf "$ephemeral_home"; }
trap cleanup EXIT

export MEMOFLOW_PACKAGED_EXECUTABLE
export MEMOFLOW_CI_KEYRING_HOME="$ephemeral_home"
export MEMOFLOW_WORKSPACE_ROOT="$workspace_root"

# Bound the entire headless Secret Service session, not only Playwright. A
# gnome-keyring prompt or a stuck Xvfb/D-Bus teardown must never strand the
# release runner after the application-level smoke has already been bounded.
# shellcheck disable=SC2016 # Inner bash must expand HOME/RANDOM/date, not this outer shell.
timeout --signal=TERM --kill-after=15s 210s \
  xvfb-run -a dbus-run-session -- bash -lc '
  set -euo pipefail
  export HOME="$MEMOFLOW_CI_KEYRING_HOME"
  export XDG_RUNTIME_DIR="$HOME/.runtime"
  export XDG_CURRENT_DESKTOP=GNOME
  export DESKTOP_SESSION=gnome
  export MEMOFLOW_PACKAGED_USE_GNOME_KEYRING=1
  mkdir -p "$HOME/.local/share/keyrings" "$XDG_RUNTIME_DIR"
  chmod 700 "$HOME" "$XDG_RUNTIME_DIR"

  # A pristine headless runner has no PAM-created login keyring. If Secret
  # Service has to create one on first use, gnome-keyring activates
  # org.gnome.keyring.SystemPrompter and waits for GUI input forever. Seed the
  # standard passwordless login keyring explicitly so the secrets daemon can
  # adopt it without any interactive prompt.
  printf "%s\n" \
    "[keyring]" \
    "display-name=login" \
    "ctime=$(date +%s)" \
    "mtime=0" \
    "lock-on-idle=false" \
    "lock-after=false" \
    > "$HOME/.local/share/keyrings/login.keyring"
  chmod 600 "$HOME/.local/share/keyrings/login.keyring"

  gnome-keyring-daemon --start --components=secrets >/dev/null

  secret_service_ready=0
  for _ in $(seq 1 50); do
    if gdbus call --session \
      --dest org.freedesktop.DBus \
      --object-path /org/freedesktop/DBus \
      --method org.freedesktop.DBus.GetNameOwner \
      org.freedesktop.secrets >/dev/null 2>&1; then
      secret_service_ready=1
      break
    fi
    sleep 0.1
  done
  test "$secret_service_ready" = 1

  # Fail closed unless the passwordless collection is actually writable and
  # readable. This also catches daemon startup drift before Electron launches.
  sentinel_key="memoflow-ci-sentinel-$RANDOM-$$"
  sentinel_value="memoflow-ci-secret-$RANDOM-$$"
  printf "%s" "$sentinel_value" | secret-tool store --label="MemoFlow CI packaged smoke" memoflow-ci "$sentinel_key"
  resolved_value="$(secret-tool lookup memoflow-ci "$sentinel_key")"
  test "$resolved_value" = "$sentinel_value"
  secret-tool clear memoflow-ci "$sentinel_key"
  unset sentinel_key sentinel_value resolved_value

  cd "$MEMOFLOW_WORKSPACE_ROOT"
  timeout --signal=TERM --kill-after=15s 150s pnpm nx run desktop:test:packaged-smoke --outputStyle=static
'
