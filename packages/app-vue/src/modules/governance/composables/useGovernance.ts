/**
 * useGovernance - 治理模块主 composable
 *
 * 通过 DI 注入的 IRuleApiClient 与后端交互。
 * API Client 返回 Result<T>，Composable 负责 Result 解包 + Store 更新 + 消息提示。
 *
 * NOTE: IRuleApiClient 尚未提供 revisions 相关方法，
 * fetchRevisions 暂为空操作。待接口扩展后实现。
 *
 * @module governance/composables
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGovernanceStore } from '../stores/governanceStore';
import { RULE_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type {
  RuleClientDTO,
  CreateRuleReq,
  UpdateRuleReq,
  RuleStatus,
  RuleSeverity,
} from '../types';

export function useGovernance() {
  const store = useGovernanceStore();
  const savingId = ref<string | null>(null);
  const apiClient = useStrictInject(RULE_SERVICE_KEY, 'RuleService');
  const { t } = useI18n();

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
      const result = await apiClient.listRules(query);
      if (result.ok) {
        store.setRules(result.data.items ?? [], result.data.total ?? 0);
      } else {
        store.setError(result.error.message || t('governance.error.loadListFailed'));
      }
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
      const result = await apiClient.getRule({ id });
      if (result.ok) {
        store.setCurrentRule(result.data);
        return result.data;
      }
      store.setError(result.error.message || t('governance.error.loadRuleFailed'));
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
      const result = await apiClient.createRule(req);
      if (result.ok) {
        store.addRule(result.data);
        return result.data;
      }
      store.setError(result.error.message || t('governance.error.createRuleFailed'));
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
      const result = await apiClient.updateRule(id, req);
      if (result.ok) {
        store.updateRule(result.data);
        return result.data;
      }
      store.setError(result.error.message || t('governance.error.updateRuleFailed'));
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
      const result = await apiClient.deleteRule({ id });
      if (result.ok) {
        store.removeRule(id);
        return true;
      }
      store.setError(result.error.message || t('governance.error.deleteRuleFailed'));
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
    if (!query.trim()) {
      await fetchRules();
      return;
    }
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await apiClient.searchRules({
        query,
        status: store.filter.status ?? undefined,
        tags: store.filter.tags.length > 0 ? store.filter.tags : undefined,
        severity: store.filter.severity ?? undefined,
        page: store.pagination.page,
        pageSize: store.pagination.pageSize,
      });
      if (result.ok) {
        store.setRules(result.data.items ?? [], result.data.total ?? 0);
      } else {
        store.setError(result.error.message || t('governance.error.searchRuleFailed'));
      }
    } finally {
      store.setLoading(false);
    }
  }

  /**
   * 加载修订历史
   *
   * TODO: IRuleApiClient 尚未提供 revisions 相关方法，
   * 待 @dailyuse/governance 接口扩展后实现。
   */
  async function fetchRevisions(_ruleId: string): Promise<void> {
    console.warn('[governance] fetchRevisions not yet available in IRuleApiClient');
    store.setRevisions([]);
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
