/**
 * Server-state QueryClient factory for the RefArch Phase 5 pilots.
 * 参考架构阶段 5 试点用的 server-state QueryClient 工厂。
 *
 * Production client applies the per-lane runtime policy (§3.5). The test factory pins
 * `retry:false` and a short gc so Vitest runs are deterministic and leave no open handles.
 * 生产 client 应用 per-lane 运行时策略；测试工厂固定 `retry:false` 与短 gc，保证 Vitest 确定性。
 */

import { QueryClient } from '@tanstack/vue-query';
import type { ServerStateRuntimePolicy } from './query-policy';

/**
 * Create the renderer-owned QueryClient for a pilot runtime.
 * 为试点运行时创建 renderer 持有的 QueryClient（每个 authenticated renderer 恰好一个）。
 */
export function createServerQueryClient(policy: ServerStateRuntimePolicy): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Per-module staleTime is set at the query option level (notification 30s, task 60s).
        // 各模块 staleTime 由 query option 层设置（notification 30s，task 60s）。
        gcTime: policy.gcTime,
        retry: false,
        networkMode: policy.queryNetworkMode,
      },
      mutations: {
        retry: policy.mutationRetry,
        networkMode: policy.mutationNetworkMode,
      },
    },
  });
}

/**
 * Create a deterministic QueryClient for tests: retry off, short gc.
 * 创建测试用确定性 QueryClient：关闭 retry、缩短 gc。
 */
export function createTestServerQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 1_000 },
      mutations: { retry: 0 },
    },
  });
}
