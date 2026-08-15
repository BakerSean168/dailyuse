/**
 * useGovernance - Governance module main composable
 * useGovernance - 治理模块主 composable
 *
 * RefArch Phase 5（Governance Query Cache authority pilot）后，rules list / detail /
 * revisions server state 由 TanStack Vue Query 承载；本 facade 组合 list/detail/revisions
 * query 与 mutations，并保留原 public surface，供各视图与 `usePerformanceMonitor` 使用。
 * Pinia 只保留 searchQuery/filter/pagination 等 UI state。
 */

import { computed, ref } from 'vue';
import { useGovernanceStore } from '../stores/governance-store';
import { toGovernanceDisplayRule } from '../display-rule';
import type { CreateRuleReq, RuleClientDTO, UpdateRuleReq } from '@memoflow/contracts/governance';
import { useGovernanceListQuery } from './useGovernanceListQuery';
import { useGovernanceDetailQuery } from './useGovernanceDetailQuery';
import { useGovernanceRevisionsQuery } from './useGovernanceRevisionsQuery';
import { useGovernanceMutations } from './useGovernanceMutations';
import { collectGovernanceTags, waitForGovernanceQuery } from './governanceCache';
import { useServerStateIdentityScope, useServerStateRuntime } from '../../../platform/server-state';
import { governanceQueryKeys } from '../../../platform/server-state/query-keys';

export function useGovernance() {
  const store = useGovernanceStore();
  const runtime = useServerStateRuntime();
  const resolveIdentityScope = useServerStateIdentityScope();
  const currentRuleId = ref<string | null>(null);
  const savingId = ref<string | null>(null);

  const listParams = computed(() => ({
    page: store.pagination.page,
    pageSize: store.pagination.pageSize,
    status: store.filter.status ?? undefined,
    severity: store.filter.severity ?? undefined,
    tags: store.filter.tags.length > 0 ? store.filter.tags : undefined,
    search: store.searchQuery || undefined,
  }));
  const list = useGovernanceListQuery({ params: listParams });
  const detail = useGovernanceDetailQuery(() => currentRuleId.value);
  const revisions = useGovernanceRevisionsQuery(() => currentRuleId.value);
  const mutations = useGovernanceMutations();

  const rules = computed(() => list.rules.value);
  const currentRule = computed<RuleClientDTO | null>(() => detail.currentRule.value);
  const currentRuleView = computed(() => toGovernanceDisplayRule(currentRule.value));
  const allTags = computed(() =>
    collectGovernanceTags(runtime.queryClient, resolveIdentityScope()),
  );
  const isLoading = computed(
    () => list.isLoading.value || detail.isLoading.value || revisions.isLoading.value,
  );
  const error = computed(() => list.error.value ?? detail.error.value ?? revisions.error.value);
  const isSaving = computed(() => savingId.value !== null || mutations.isMutating.value);
  const pagination = computed(() => ({
    page: store.pagination.page,
    pageSize: store.pagination.pageSize,
    total: list.total.value,
  }));

  async function fetchRules(): Promise<void> {
    // Manual refresh: force an active refetch of the current canonical list key (matches the
    // pre-pilot `fetchRules()` which always hit the service regardless of stale state).
    // 手动刷新：强制按当前 canonical list key 触发 active refetch（与迁移前 fetchRules 一致）。
    await runtime.queryClient.refetchQueries({
      queryKey: governanceQueryKeys.list(resolveIdentityScope(), listParams.value),
      type: 'active',
    });
  }

  async function fetchRule(id: string): Promise<RuleClientDTO | null> {
    currentRuleId.value = id;
    const identityScope = resolveIdentityScope();
    const key = governanceQueryKeys.detail(identityScope, id);
    await waitForGovernanceQuery(runtime.queryClient, key);
    return runtime.queryClient.getQueryData<RuleClientDTO>(key) ?? null;
  }

  async function fetchRevisions(ruleId: string): Promise<void> {
    currentRuleId.value = ruleId;
    await waitForGovernanceQuery(
      runtime.queryClient,
      governanceQueryKeys.revisions(resolveIdentityScope(), ruleId),
    );
  }

  async function createRule(req: CreateRuleReq): Promise<RuleClientDTO | null> {
    savingId.value = 'new';
    try {
      return await mutations.createRule.mutateAsync(req);
    } catch {
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function updateRule(id: string, req: UpdateRuleReq): Promise<RuleClientDTO | null> {
    savingId.value = id;
    try {
      return await mutations.updateRule.mutateAsync({ id, req });
    } catch {
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function deleteRule(id: string): Promise<boolean> {
    savingId.value = id;
    try {
      await mutations.deleteRule.mutateAsync(id);
      return true;
    } catch {
      return false;
    } finally {
      savingId.value = null;
    }
  }

  async function searchRules(query: string): Promise<void> {
    store.setSearchQuery(query);
    // The canonical key changes with the search field; force an active refetch so a repeated
    // identical search still re-reads the server (matches the pre-pilot `searchRules`).
    // search 字段进入 canonical key；强制 active refetch 保证重复搜索仍会重新读取服务端。
    await runtime.queryClient.refetchQueries({
      queryKey: governanceQueryKeys.list(resolveIdentityScope(), listParams.value),
      type: 'active',
    });
  }
  function setFilterStatus(status: RuleClientDTO['status'] | null): void {
    store.setFilterStatus(status ?? null);
    void fetchRules();
  }

  function setFilterSeverity(severity: RuleClientDTO['severity'] | null): void {
    store.setFilterSeverity(severity ?? null);
    void fetchRules();
  }

  function toggleFilterTag(tag: string): void {
    store.toggleFilterTag(tag);
    void fetchRules();
  }

  function clearFilters(): void {
    store.clearFilters();
    void fetchRules();
  }

  function setPage(page: number): void {
    store.setPage(page);
    void fetchRules();
  }

  return {
    rules,
    currentRule,
    currentRuleView,
    revisions: computed(() => revisions.revisions.value),
    isLoading,
    isSaving,
    error,
    searchQuery: computed(() => store.searchQuery),
    filter: computed(() => store.filter),
    pagination,
    allTags,
    hasActiveFilter: computed(() => store.hasActiveFilter),
    fetchRules,
    fetchRule,
    createRule,
    updateRule,
    deleteRule,
    searchRules,
    fetchRevisions,
    setFilterStatus,
    setFilterSeverity,
    toggleFilterTag,
    clearFilters,
    setPage,
  };
}
