/**
 * useGovernance - Governance module main composable
 * useGovernance - 治理模块主 composable
 *
 * Responsibilities:
 * - Calls the injected governance client seam
 * - Keeps Pinia as normalized POJO cache
 * - Derives a lightweight UI display model locally
 * 职责：
 * - 调用注入的治理客户端 seam
 * - 让 Pinia 作为规范化 POJO 缓存
 * - 在 app 层本地派生轻量展示模型
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGovernanceStore } from '../stores/governance-store';
import { RULE_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type {
  CreateRuleReq,
  RuleClientDTO,
  RuleId,
  RuleRevisionClientDTO,
  RuleSeverity,
  RuleStatus,
  UpdateRuleReq,
} from '../types';
import { toGovernanceDisplayRule } from '../display-rule';
import { translateResultError } from '../../../shared/utils/translate-result-error';

export function useGovernance() {
  const store = useGovernanceStore();
  const savingId = ref<string | null>(null);
  const service = useStrictInject(RULE_SERVICE_KEY, 'RuleService');
  const { t } = useI18n();

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
  const currentRuleView = computed(() => toGovernanceDisplayRule(currentRule.value));

  function setGovernanceError(error: unknown, fallbackKey: string) {
    store.setError(translateResultError(error, t, { fallbackKey }));
  }

  async function fetchRules(): Promise<void> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.listRules(store.currentListQuery);
      if (result.ok) {
        store.setRules(result.data.items ?? [], result.data.total ?? 0);
      } else {
        setGovernanceError(result.error, 'governance.error.loadListFailed');
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchRule(id: string): Promise<RuleClientDTO | null> {
    store.setLoading(true);
    store.setError(null);
    try {
      const cached = store.getRuleById(id);
      if (cached) {
        store.setCurrentRule(cached);
        return cached;
      }

      const result = await service.getRule({ id: id as RuleId });
      if (result.ok) {
        store.setCurrentRule(result.data);
        return result.data;
      }
      setGovernanceError(result.error, 'governance.error.loadRuleFailed');
      return null;
    } finally {
      store.setLoading(false);
    }
  }

  async function createRule(req: CreateRuleReq): Promise<RuleClientDTO | null> {
    savingId.value = 'new';
    store.setError(null);
    try {
      const result = await service.createRule(req);
      if (result.ok) {
        store.addRule(result.data);
        store.setCurrentRule(result.data);
        return result.data;
      }
      setGovernanceError(result.error, 'governance.error.createRuleFailed');
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function updateRule(id: string, req: UpdateRuleReq): Promise<RuleClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.updateRule(id, req);
      if (result.ok) {
        store.updateRule(result.data);
        store.setCurrentRule(result.data);
        return result.data;
      }
      setGovernanceError(result.error, 'governance.error.updateRuleFailed');
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function deleteRule(id: string): Promise<boolean> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.deleteRule({ id: id as RuleId });
      if (result.ok) {
        store.removeRule(id);
        return true;
      }
      setGovernanceError(result.error, 'governance.error.deleteRuleFailed');
      return false;
    } finally {
      savingId.value = null;
    }
  }

  async function searchRules(query: string): Promise<void> {
    store.setSearchQuery(query);
    if (!query.trim()) {
      await fetchRules();
      return;
    }

    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.searchRules({
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
        setGovernanceError(result.error, 'governance.error.searchRuleFailed');
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchRevisions(ruleId: string): Promise<void> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.getRevisions({
        ruleId,
        page: 1,
        pageSize: 50,
      });
      if (result.ok) {
        store.setRevisions(result.data.items ?? ([] as RuleRevisionClientDTO[]));
      } else {
        setGovernanceError(result.error, 'governance.error.loadRevisionFailed');
      }
    } finally {
      store.setLoading(false);
    }
  }

  function setFilterStatus(status: RuleStatus | null): void {
    store.setFilterStatus(status);
    void fetchRules();
  }

  function setFilterSeverity(severity: RuleSeverity | null): void {
    store.setFilterSeverity(severity);
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
    revisions,
    isLoading,
    isSaving,
    error,
    searchQuery,
    filter,
    pagination,
    allTags,
    hasActiveFilter,
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