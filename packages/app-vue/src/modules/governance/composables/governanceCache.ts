/**
 * Governance query cache patch helpers (module internal; plan §3.6).
 * Governance query cache 的 patch helper（模块内部，§3.6）。
 *
 * Only mutation lifecycles call `setQueryData`/`removeQueries` through these helpers;
 * realtime event adapters and components never patch the cache directly.
 * 只有 mutation lifecycle 通过这里调用 `setQueryData`/`removeQueries`；实时事件适配器与组件绝不直接 patch cache。
 */

import type { QueryClient, QueryKey } from '@tanstack/vue-query';
import { hashKey } from '@tanstack/vue-query';
import type { ListRulesRes } from '@memoflow/contracts/governance';
import type { RuleClientDTO } from '@memoflow/contracts/governance';
import { governanceQueryKeys } from '../../../platform/server-state/query-keys';

/**
 * Wait until a query key reaches a terminal state (`success`/`error`) or is removed.
 * Unsubscribes in every terminal path so imperative facade callers never hang.
 * 等待指定 query key 进入终态（`success`/`error`）或被移除；每个终态路径都会取消订阅。
 */
export function waitForGovernanceQuery(
  queryClient: QueryClient,
  queryKey: QueryKey,
): Promise<void> {
  const state = queryClient.getQueryState(queryKey);
  if (state) {
    if (state.status === 'success' || state.status === 'error') {
      return Promise.resolve();
    }
  }
  return new Promise((resolve) => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (hashKey(event.query.queryKey) !== hashKey(queryKey)) return;
      if (event.type === 'removed') {
        unsubscribe();
        resolve();
        return;
      }
      if (
        event.type === 'updated' &&
        (event.query.state.status === 'success' || event.query.state.status === 'error')
      ) {
        unsubscribe();
        resolve();
      }
    });
  });
}

/**
 * Collect every unique tag value across all cached rule list entries for an identity.
 * 汇总 identity 下所有已缓存规则列表条目的唯一标签值（用于筛选下拉）。
 */
export function collectGovernanceTags(queryClient: QueryClient, identityScope: string): string[] {
  const tags = new Set<string>();
  const lists = queryClient.getQueriesData<ListRulesRes>({
    queryKey: governanceQueryKeys.lists(identityScope),
  });
  for (const [, data] of lists) {
    for (const rule of data?.items ?? []) {
      for (const tag of rule.tags) tags.add(tag.value);
    }
  }
  return Array.from(tags).sort();
}

/**
 * Read one rule from the detail cache, falling back to any cached identity list.
 * 从 detail cache 读取规则；缺失时回退到任意已缓存的 identity list。
 */
export function findRuleInCache(
  queryClient: QueryClient,
  identityScope: string,
  id: string,
): RuleClientDTO | undefined {
  const detail = queryClient.getQueryData<RuleClientDTO>(
    governanceQueryKeys.detail(identityScope, id),
  );
  if (detail) return detail;
  const lists = queryClient.getQueriesData<ListRulesRes>({
    queryKey: governanceQueryKeys.lists(identityScope),
  });
  for (const [, data] of lists) {
    const found = data?.items.find((r) => r.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Patch every cached list entry + the detail for a server-confirmed rule.
 * 用 server-confirmed 的 DTO patch 所有已缓存 list 条目与 detail。
 */
export function patchRuleFromServer(
  queryClient: QueryClient,
  identityScope: string,
  rule: RuleClientDTO,
): void {
  const lists = queryClient.getQueriesData<ListRulesRes>({
    queryKey: governanceQueryKeys.lists(identityScope),
  });
  for (const [queryKey, data] of lists) {
    if (!data) continue;
    queryClient.setQueryData<ListRulesRes>(queryKey as QueryKey, {
      ...data,
      items: data.items.map((r) => (r.id === rule.id ? rule : r)),
    });
  }
  queryClient.setQueryData<RuleClientDTO>(governanceQueryKeys.detail(identityScope, rule.id), rule);
}

/**
 * Remove a server-confirmed deleted rule from every cached list + detail.
 * 从所有已缓存 list 与 detail 中移除 server-confirmed 删除的规则。
 */
export function removeRuleFromCache(
  queryClient: QueryClient,
  identityScope: string,
  id: string,
): void {
  const lists = queryClient.getQueriesData<ListRulesRes>({
    queryKey: governanceQueryKeys.lists(identityScope),
  });
  for (const [queryKey, data] of lists) {
    if (!data) continue;
    queryClient.setQueryData<ListRulesRes>(queryKey as QueryKey, {
      ...data,
      items: data.items.filter((r) => r.id !== id),
    });
  }
  queryClient.removeQueries({ queryKey: governanceQueryKeys.detail(identityScope, id) });
}
