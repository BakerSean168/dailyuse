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

/** Create + install the web server-state runtime and remember it. */
export function installWebServerStateRuntime(app: App): ServerStateRuntime {
  const authStore = useAuthenticationStore();
  const runtime = installServerStateRuntime(app, 'web', {
    identityScope: () => authStore.getIdentityId ?? '',
  });
  currentRuntime = runtime;
  return runtime;
}

/** Read the installed runtime (null before install). */
export function getWebServerStateRuntime(): ServerStateRuntime | null {
  return currentRuntime;
}

/** Register a realtime source so logout stops it before clearing the cache. */
export function registerWebServerStateSource(source: { stop: () => void }): void {
  sources.push(source);
}

/** Stop realtime sources, then clear the cache for an identity (logout / identity switch). */
export function clearWebServerStateIdentity(identityScope: string): void {
  for (const source of sources) source.stop();
  sources = [];
  currentRuntime?.clearIdentity(identityScope);
}
