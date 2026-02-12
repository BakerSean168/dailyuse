/**
 * useGovernance - 治理模块主 composable
 *
 * 编排 API 调用 + Store 更新 + 消息提示。
 * 组件通过此 composable 与治理模块交互。
 */

import { computed, ref } from 'vue';
import { useGovernanceStore } from '../stores/governanceStore';
import { governanceApi, GovernanceApiError } from '../services/governanceApi';
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
      const res = await governanceApi.listRules(query);
      store.setRules(res.items, res.total);
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
      const rule = await governanceApi.getRule(id);
      store.setCurrentRule(rule);
      return rule;
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
      const rule = await governanceApi.createRule(req);
      store.addRule(rule);
      return rule;
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
      const rule = await governanceApi.updateRule(id, req);
      store.updateRule(rule);
      return rule;
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
      await governanceApi.deleteRule(id);
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
      const res = await governanceApi.searchRules({
        query,
        status: store.filter.status ?? undefined,
        tags: store.filter.tags.length > 0 ? store.filter.tags : undefined,
        severity: store.filter.severity ?? undefined,
        page: store.pagination.page,
        pageSize: store.pagination.pageSize,
      });
      store.setRules(res.items, res.total);
    } catch (err) {
      handleError(err, '搜索规则失败');
    } finally {
      store.setLoading(false);
    }
  }

  /**
   * 加载修订历史
   */
  async function fetchRevisions(ruleId: string): Promise<void> {
    try {
      const revisions = await governanceApi.getRevisions(ruleId);
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
    if (err instanceof GovernanceApiError) {
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
