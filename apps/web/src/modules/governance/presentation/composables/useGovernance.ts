/**
 * useGovernance - 治理模块主 composable
 *
 * 通过 DI 注入的 IRuleApiClient 与后端交互。
 * API Client 返回 Result<T>，Composable 负责 Result 解包 + Store 更新 + 消息提示。
 *
 * @module governance/presentation/composables
 */

import { computed, ref, inject } from 'vue';
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
    const query = store.currentListQuery;
    const result = await apiClient.listRules(query);
    if (result.ok) {
      store.setRules(result.data.items, result.data.total);
    } else {
      store.setError(result.error.message || '加载规则列表失败');
    }
    store.setLoading(false);
  }

  /**
   * 获取单个规则
   */
  async function fetchRule(id: string): Promise<RuleClientDTO | null> {
    store.setLoading(true);
    store.setError(null);
    const result = await apiClient.getRule({ id });
    store.setLoading(false);
    if (result.ok) {
      store.setCurrentRule(result.data);
      return result.data;
    }
    store.setError(result.error.message || '加载规则失败');
    return null;
  }

  /**
   * 创建规则
   */
  async function createRule(req: CreateRuleReq): Promise<RuleClientDTO | null> {
    savingId.value = 'new';
    store.setError(null);
    const result = await apiClient.createRule(req);
    savingId.value = null;
    if (result.ok) {
      store.addRule(result.data);
      return result.data;
    }
    store.setError(result.error.message || '创建规则失败');
    return null;
  }

  /**
   * 更新规则
   */
  async function updateRule(id: string, req: UpdateRuleReq): Promise<RuleClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    const result = await apiClient.updateRule(id, req);
    savingId.value = null;
    if (result.ok) {
      store.updateRule(result.data);
      return result.data;
    }
    store.setError(result.error.message || '更新规则失败');
    return null;
  }

  /**
   * 删除规则
   */
  async function deleteRule(id: string): Promise<boolean> {
    savingId.value = id;
    store.setError(null);
    const result = await apiClient.deleteRule({ id });
    savingId.value = null;
    if (result.ok) {
      store.removeRule(id);
      return true;
    }
    store.setError(result.error.message || '删除规则失败');
    return false;
  }

  /**
   * 搜索规则
   */
  async function searchRules(query: string): Promise<void> {
    store.setSearchQuery(query);
    if (!query.trim()) {
      await fetchRules();
      return;
    }
    store.setLoading(true);
    store.setError(null);
    const result = await apiClient.searchRules({
      query,
      status: store.filter.status ?? undefined,
      tags: store.filter.tags.length > 0 ? store.filter.tags : undefined,
      severity: store.filter.severity ?? undefined,
      page: store.pagination.page,
      pageSize: store.pagination.pageSize,
    });
    if (result.ok) {
      store.setRules(result.data.items, result.data.total);
    } else {
      store.setError(result.error.message || '搜索规则失败');
    }
    store.setLoading(false);
  }

  /**
   * 加载修订历史
   */
  async function fetchRevisions(ruleId: string): Promise<void> {
    await store.fetchRevisions(ruleId);
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
