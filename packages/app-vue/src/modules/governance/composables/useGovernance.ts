/**
 * useGovernance - Governance module main composable
 * useGovernance - 治理模块主 composable
 *
 * Responsibilities:
 * - Calls the injected GovernanceClientService
 * - Keeps Pinia as normalized POJO cache
 * - Hydrates domain-client Rule entities only when needed by the UI
 * 职责：
 * - 调用注入的 GovernanceClientService
 * - 让 Pinia 作为规范化 POJO 缓存
 * - 仅在 UI 需要 richer behavior 时水化 domain-client Rule 实体
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Rule } from '@dailyuse/governance/domain-client';
import { useGovernanceStore } from '../stores/governanceStore';
import { RULE_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type {
  CreateRuleReq,
  RuleClientDTO,
  RuleRevisionClientDTO,
  RuleSeverity,
  RuleStatus,
  UpdateRuleReq,
} from '../types';

function hydrateRule(dto: RuleClientDTO | null): Rule | null {
  if (!dto) return null;
  const result = Rule.fromClientDTO(dto);
  if (!result.ok) {
    console.error('[governance] failed to hydrate Rule entity', result.error);
    return null;
  }
  return result.data;
}

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

  /** Hydrated entities for richer UI-only behavior. 提供 richer UI 行为的按需水化实体。 */
  const ruleEntities = computed(
    () => rules.value.map((rule) => hydrateRule(rule)).filter(Boolean) as Rule[],
  );
  const currentRuleEntity = computed(() => hydrateRule(currentRule.value));

  async function fetchRules(): Promise<void> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.listRules(store.currentListQuery);
      if (result.ok) {
        store.setRules(result.data.items ?? [], result.data.total ?? 0);
      } else {
        store.setError(result.error.message || t('governance.error.loadListFailed'));
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

      const result = await service.getRule({ id });
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
      store.setError(result.error.message || t('governance.error.createRuleFailed'));
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
      store.setError(result.error.message || t('governance.error.updateRuleFailed'));
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function deleteRule(id: string): Promise<boolean> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await service.deleteRule({ id });
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
        store.setError(result.error.message || t('governance.error.searchRuleFailed'));
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function fetchRevisions(_ruleId: string): Promise<void> {
    console.warn('[governance] fetchRevisions not yet available in GovernanceClientService');
    store.setRevisions([] as RuleRevisionClientDTO[]);
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
    revisions,
    isLoading,
    isSaving,
    error,
    searchQuery,
    filter,
    pagination,
    allTags,
    hasActiveFilter,
    ruleEntities,
    currentRuleEntity,
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
