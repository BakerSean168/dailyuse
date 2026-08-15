/**
 * Server-state runtime composition for authenticated renderers (plan §3.1, §3.6).
 * 已认证 renderer 的 server-state 运行时组合（§3.1、§3.6）。
 *
 * Each authenticated renderer runtime owns exactly one QueryClient + dispatcher. Web and
 * Desktop never share an instance; auth-only entries install no query cache. Identity
 * changes must stop realtime sources first, then call `clearIdentity` — never let the
 * previous identity's data flash to the next identity.
 * 每个已认证 renderer 恰好持有一个 QueryClient + dispatcher；Web/Desktop 不共享实例；
 * 身份变化必须先 stop 实时源再 clearIdentity，禁止跨身份数据闪现。
 */

import { type App, inject, type InjectionKey } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import { createServerQueryClient, createTestServerQueryClient } from './query-client';
import {
  createServerStateRuntimePolicy,
  type RuntimeLane,
  type ServerStateRuntimePolicy,
} from './query-policy';
import {
  createServerStateInvalidationDispatcher,
  type ServerStateInvalidationDispatcher,
} from './invalidation-dispatcher';

/** DI key for the renderer server-state runtime. renderer server-state 运行时 DI key。 */
export const SERVER_STATE_RUNTIME_KEY: InjectionKey<ServerStateRuntime> =
  Symbol('ServerStateRuntime');

/**
 * DI key for the effective identity-scope resolver (plan §3.1: keys must carry the
 * effective identityScope; web uses cloud auth identity, desktop uses the local
 * account/profile identity).
 * 有效 identity-scope 解析器 DI key：query keys 必须携带 effective identityScope；
 * Web 用 cloud auth identity，Desktop 用本地 account/profile identity。
 */
export const SERVER_STATE_IDENTITY_SCOPE_KEY: InjectionKey<() => string> = Symbol(
  'ServerStateIdentityScope',
);

/**
 * Composition root surface for one authenticated renderer.
 * 单个已认证 renderer 的组合根对外表面：queryClient + dispatcher + dispose/clearIdentity。
 */
export interface ServerStateRuntime {
  /** The renderer-owned QueryClient. renderer 持有的 QueryClient。 */
  queryClient: QueryClient;
  /** Sole invalidation owner; event adapters must only talk to it. 失效唯一入口。 */
  dispatcher: ServerStateInvalidationDispatcher;
  /** Clear the whole pilot cache (renderer dispose / logout). 清空试点缓存。 */
  dispose(): void;
  /** Clear the cache for one identity (logout / profile lock/switch). 清除指定 identity 缓存。 */
  clearIdentity(identityScope: string): void;
}

/**
 * Create a server-state runtime for a lane.
 * 为指定 lane 创建 server-state 运行时。
 */
export function createServerStateRuntime(lane: RuntimeLane): ServerStateRuntime {
  const policy = createServerStateRuntimePolicy(lane);
  const queryClient = createServerQueryClient(policy);
  const dispatcher = createServerStateInvalidationDispatcher(queryClient);
  return {
    queryClient,
    dispatcher,
    dispose: () => {
      queryClient.clear();
    },
    clearIdentity: (identityScope: string) => {
      dispatcher.clearIdentity(identityScope);
    },
  };
}

/**
 * Create a deterministic test runtime (retry off, short gc).
 * 创建确定性测试运行时（retry 关闭、短 gc）。
 */
export function createTestServerStateRuntime(): ServerStateRuntime {
  const queryClient = createTestServerQueryClient();
  const dispatcher = createServerStateInvalidationDispatcher(queryClient);
  return {
    queryClient,
    dispatcher,
    dispose: () => {
      queryClient.clear();
    },
    clearIdentity: (identityScope: string) => {
      dispatcher.clearIdentity(identityScope);
    },
  };
}

/** Options for `installServerStateRuntime`. 安装 server-state 运行时的选项。 */
export interface InstallServerStateRuntimeOptions {
  /** Optional lane policy override (tests). 可选：覆盖 lane 策略（测试用）。 */
  policy?: ServerStateRuntimePolicy;
  /**
   * Effective identity-scope resolver for this renderer. When absent the composables fall
   * back to `''` and invalidation fails closed (hosts MUST provide it in production).
   * 当前 renderer 的 effective identity-scope 解析器；缺失时 composables 回退 `''` 且失效 fail closed。
   */
  identityScope?: (() => string) | string;
}

/**
 * Create the runtime, install the Vue Query plugin and provide the runtime via DI.
 * Host composition root convenience: call once per authenticated renderer before mount.
 * 创建运行时、安装 Vue Query 插件并通过 DI provide；host 组合根在 mount 前调用一次。
 */
export function installServerStateRuntime(
  app: App,
  lane: RuntimeLane,
  options?: InstallServerStateRuntimeOptions,
): ServerStateRuntime {
  const policy = options?.policy ?? createServerStateRuntimePolicy(lane);
  const queryClient = createServerQueryClient(policy);
  const dispatcher = createServerStateInvalidationDispatcher(queryClient);
  const runtime: ServerStateRuntime = {
    queryClient,
    dispatcher,
    dispose: () => queryClient.clear(),
    clearIdentity: (identityScope: string) => dispatcher.clearIdentity(identityScope),
  };
  const resolveIdentityScope: () => string =
    typeof options?.identityScope === 'function'
      ? options.identityScope
      : typeof options?.identityScope === 'string'
        ? () => options.identityScope as string
        : () => '';
  app.use(VueQueryPlugin, { queryClient });
  app.provide(SERVER_STATE_RUNTIME_KEY, runtime);
  app.provide(SERVER_STATE_IDENTITY_SCOPE_KEY, resolveIdentityScope);
  return runtime;
}

/**
 * Read the current renderer server-state runtime (must be installed/provided).
 * 读取当前 renderer 的 server-state 运行时（须已安装/provide）。
 */
export function useServerStateRuntime(): ServerStateRuntime {
  const runtime = inject(SERVER_STATE_RUNTIME_KEY, null);
  if (!runtime) {
    throw new Error('ServerStateRuntime is not installed for this renderer');
  }
  return runtime;
}

/**
 * Read the current renderer identity-scope resolver (must be installed/provided).
 * 读取当前 renderer 的 identity-scope 解析器（须已安装/provide）。
 */
export function useServerStateIdentityScope(): () => string {
  return inject(SERVER_STATE_IDENTITY_SCOPE_KEY, () => '');
}
