/**
 * Web host server-state runtime holder.
 *
 * Creates and installs the renderer-owned Query Cache runtime (lane: web HTTP) and keeps
 * a single instance for the logout handler to clear the identity cache on sign-out.
 * Identity scope comes from the cloud auth session (plan §3.1).
 * Realtime sources (eventBus hook / SSE) register their `stop` here so logout stops
 * sources before clearing the identity cache (plan §3.1 ordering).
 * 创建并安装 web lane 的 renderer Query Cache runtime，并持有单例供登出时停止源并清空缓存。
 */

import type { App } from 'vue';
import {
  installServerStateRuntime,
  useAuthenticationStore,
  type ServerStateRuntime,
} from '@memoflow/app-vue';

let currentRuntime: ServerStateRuntime | null = null;
let sources: Array<{ stop: () => void }> = [];
let disposed = false;
let pendingStartupCancel: (() => void) | null = null;

/** Create + install the web server-state runtime and remember it. */
export function installWebServerStateRuntime(app: App): ServerStateRuntime {
  const authStore = useAuthenticationStore();
  const runtime = installServerStateRuntime(app, 'web', {
    identityScope: () => authStore.getIdentityId ?? '',
  });
  currentRuntime = runtime;
  disposed = false;
  return runtime;
}

/** Read the installed runtime (null before install). */
export function getWebServerStateRuntime(): ServerStateRuntime | null {
  return currentRuntime;
}

/**
 * Whether the runtime/sources were disposed (logout). Deferred startup must not start
 * realtime sources after a logout ran first (plan §3.1 ordering; P2-5).
 * runtime/sources 是否已被 dispose（登出）；延迟启动不得在登出后继续启动实时源（P2-5）。
 */
export function isWebServerStateDisposed(): boolean {
  return disposed;
}

/**
 * Register a cancellation for the deferred startup (requestIdleCallback / setTimeout) so a
 * logout that runs before it fires can cancel it (P2-5).
 * 注册延迟启动（requestIdleCallback / setTimeout）的取消器：若登出先于它执行则取消（P2-5）。
 */
export function registerWebServerStateStartupCancel(cancel: () => void): void {
  pendingStartupCancel = cancel;
}

/** Register a realtime source so logout stops it before clearing the cache. */
export function registerWebServerStateSource(source: { stop: () => void }): void {
  sources.push(source);
}

/** Stop realtime sources, then clear the cache for an identity (logout / identity switch). */
export function clearWebServerStateIdentity(identityScope: string): void {
  disposed = true;
  pendingStartupCancel?.();
  pendingStartupCancel = null;
  for (const source of sources) source.stop();
  sources = [];
  currentRuntime?.clearIdentity(identityScope);
}
