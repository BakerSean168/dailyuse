/**
 * useGovernance - 治理模块主 composable
 *
 * 通过 DI 注入的 IRuleApiClient 与后端交互。
 * API Client 负责 HTTP 调用，Composable 负责 Store 更新 + 消息提示。
 *
 * @module governance/presentation/composables
 */

import { computed, ref, inject } from 'vue';
import { HttpClientError } from '@dailyuse/http-client';
import { useGovernanceStore } from '../stores/governanceStore';
import { RULE_API_CLIENT_KEY, ruleApiClient as fallbackClient } from '@/shared/di';
import type {
  RuleClientDTO,
  CreateRuleReq,
  UpdateRuleReq,
  RuleStatus,
  RuleSeverity,
} from '../../types';

export function useGovernance() {
  const store = useGovernanceStore();
  const savingId = ref<string | null>(null);

  // 优先从 provide/inject 获取，降级使用单例
  const apiClient = inject(RULE_API_CLIENT_KEY, fallbackClient);

  // ============ Computed State ============

  const rules = computed(() => store.rules);
  const currentRule = computed(() => store.currentRule);
  const revisions = computed(() => store.revisions);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const searchQuery = computed(() => store.searchQuery);
  const filter = computed(() => store.filter);
  const pagination = computed(() => store.pagination);
  const allTags = computed(() => store.allTags);
  const hasActiveFilter = computed(() => store.hasActiveFilter);
  const isSaving = computed(() => savingId.value !== null);

  // ============ API Actions ============

  /**
   * 加载规则列表
   */
  async function fetchRules(): Promise<void> {
    store.setLoading(true);
    store.setError(null);
    try {
      const query = store.currentListQuery;
      const res = await apiClient.listRules(query as any);
      store.setRules(res.items as unknown as RuleClientDTO[], res.total);
    } catch (err) {
      handleError(err, '加载规则列表失败');
    } finally {
      store.setLoading(false);
    }
  }

  /**
   * 获取单个规则
   */
  async function fetchRule(id: string): Promise<RuleClientDTO | null> {
    store.setLoading(true);
    store.setError(null);
    try {
      const rule = await apiClient.getRule({ id } as any);
      store.setCurrentRule(rule as unknown as RuleClientDTO);
      return rule as unknown as RuleClientDTO;
    } catch (err) {
      handleError(err, '加载规则失败');
      return null;
    } finally {
      store.setLoading(false);
    }
  }

  /**
   * 创建规则
   */
  async function createRule(req: CreateRuleReq): Promise<RuleClientDTO | null> {
    savingId.value = 'new';
    store.setError(null);
    try {
      const rule = await apiClient.createRule(req as any);
      store.addRule(rule as unknown as RuleClientDTO);
      return rule as unknown as RuleClientDTO;
    } catch (err) {
      handleError(err, '创建规则失败');
      return null;
    } finally {
      savingId.value = null;
    }
  }

  /**
   * 更新规则
   */
  async function updateRule(id: string, req: UpdateRuleReq): Promise<RuleClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const rule = await apiClient.updateRule(id, req as any);
      store.updateRule(rule as unknown as RuleClientDTO);
      return rule as unknown as RuleClientDTO;
    } catch (err) {
      handleError(err, '更新规则失败');
      return null;
    } finally {
      savingId.value = null;
    }
  }

  /**
   * 删除规则
   */
  async function deleteRule(id: string): Promise<boolean> {
    savingId.value = id;
    store.setError(null);
    try {
      await apiClient.deleteRule({ id } as any);
      store.removeRule(id);
      return true;
    } catch (err) {
      handleError(err, '删除规则失败');
      return false;
    } finally {
      savingId.value = null;
    }
  }

  /**
   * 搜索规则
   */
  async function searchRules(query: string): Promise<void> {
    store.setSearchQuery(query);
    store.setLoading(true);
    store.setError(null);
    try {
      if (!query.trim()) {
        await fetchRules();
        return;
      }
      const res = await apiClient.searchRules({
        query,
        status: store.filter.status ?? undefined,
        tags: store.filter.tags.length > 0 ? store.filter.tags : undefined,
        severity: store.filter.severity ?? undefined,
        page: store.pagination.page,
        pageSize: store.pagination.pageSize,
      } as any);
      store.setRules(res.items as unknown as RuleClientDTO[], res.total);
    } catch (err) {
      handleError(err, '搜索规则失败');
    } finally {
      store.setLoading(false);
    }
  }

  /**
   * 加载修订历史
   * 注：IRuleApiClient 暂不含 getRevisions，保持降级使用 fetch
   */
  async function fetchRevisions(ruleId: string): Promise<void> {
    try {
      // IRuleApiClient 尚未暴露 getRevisions
      // 暂时使用 httpClient 直接请求
      const { httpClient } = await import('@/shared/http');
      const revisions = await httpClient.get<any>(`/governance/rules/${ruleId}/revisions`);
      store.setRevisions(revisions);
    } catch (err) {
      handleError(err, '加载修订历史失败');
    }
  }

  // ============ Filters ============

  function setFilterStatus(status: RuleStatus | null): void {
    store.setFilterStatus(status);
    fetchRules();
  }

  function setFilterSeverity(severity: RuleSeverity | null): void {
    store.setFilterSeverity(severity);
    fetchRules();
  }

  function toggleFilterTag(tag: string): void {
    store.toggleFilterTag(tag);
    fetchRules();
  }

  function clearFilters(): void {
    store.clearFilters();
    fetchRules();
  }

  function setPage(page: number): void {
    store.setPage(page);
    fetchRules();
  }

  // ============ Error Handling ============

  function handleError(err: unknown, fallbackMessage: string): void {
    if (err instanceof HttpClientError) {
      store.setError(err.message);
    } else if (err instanceof Error) {
      store.setError(err.message);
    } else {
      store.setError(fallbackMessage);
    }
    console.error(fallbackMessage, err);
  }

  // ============ Return ============

  return {
    // State
    rules,
    currentRule,
    revisions,
    isLoading,
    isSaving,
    error,
    searchQuery,
    filter,
    pagination,
    allTags,
    hasActiveFilter,

    // Actions
    fetchRules,
    fetchRule,
    createRule,
    updateRule,
    deleteRule,
    searchRules,
    fetchRevisions,

    // Filters
    setFilterStatus,
    setFilterSeverity,
    toggleFilterTag,
    clearFilters,
    setPage,
  };
}
