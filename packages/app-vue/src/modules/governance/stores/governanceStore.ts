/**
 * Governance Store - Pinia State Management
 * Governance Store - Pinia 状态管理
 *
 * Stores governance data as normalized POJO state.
 * API calls and entity hydration are handled by composables/services.
 * 以规范化 POJO 形式存储治理数据。
 * API 调用与实体水化由 composable / service 负责。
 */

import { defineStore } from 'pinia';
import type {
  ListRulesQuery,
  RuleClientDTO,
  RuleRevisionClientDTO,
  RuleSeverity,
  RuleStatus,
} from '../types';

export interface GovernanceState {
  /** Rules cache by ID. 按 ID 存储的规则缓存。 */
  rulesById: Record<string, RuleClientDTO>;
  /** Ordered IDs for current list result. 当前列表结果的有序 ID。 */
  ruleIds: string[];
  /** Current rule ID. 当前规则 ID。 */
  currentRuleId: string | null;
  /** Current rule revisions. 当前规则修订历史。 */
  revisions: RuleRevisionClientDTO[];
  /** Loading flag. 加载状态。 */
  isLoading: boolean;
  /** Current error message. 当前错误信息。 */
  error: string | null;
  /** Search query. 搜索关键词。 */
  searchQuery: string;
  /** Filters. 过滤条件。 */
  filter: {
    status: RuleStatus | null;
    severity: RuleSeverity | null;
    tags: string[];
  };
  /** Pagination state. 分页状态。 */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  /** Initialization flag. 初始化标记。 */
  isInitialized: boolean;
}

export const useGovernanceStore = defineStore('governance', {
  state: (): GovernanceState => ({
    rulesById: {},
    ruleIds: [],
    currentRuleId: null,
    revisions: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    filter: {
      status: null,
      severity: null,
      tags: [],
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
    isInitialized: false,
  }),

  getters: {
    /** Ordered rules for current list. 当前列表中的有序规则。 */
    rules: (state): RuleClientDTO[] =>
      state.ruleIds.map((id) => state.rulesById[id]).filter(Boolean),

    /** Current rule DTO. 当前规则 DTO。 */
    currentRule: (state): RuleClientDTO | null =>
      state.currentRuleId ? (state.rulesById[state.currentRuleId] ?? null) : null,

    /** Finds rule by ID. 根据 ID 查找规则。 */
    getRuleById:
      (state) =>
      (id: string): RuleClientDTO | null =>
        state.rulesById[id] ?? null,

    /** Filters rules by status. 按状态过滤规则。 */
    getRulesByStatus: (state) => (status: RuleStatus) =>
      Object.values(state.rulesById).filter((rule) => rule.status === status),

    /** Filters rules by tag. 按标签过滤规则。 */
    getRulesByTag: (state) => (tag: string) =>
      Object.values(state.rulesById).filter((rule: RuleClientDTO) =>
        rule.tags.some((item: RuleClientDTO['tags'][number]) => item.value === tag),
      ),

    /** Filters rules by severity. 按严重级别过滤规则。 */
    getRulesBySeverity: (state) => (severity: RuleSeverity) =>
      Object.values(state.rulesById).filter((rule) => rule.severity === severity),

    /** All unique tags from current cache. 当前缓存中的所有唯一标签。 */
    allTags: (state): string[] => {
      const tags = new Set<string>();
      Object.values(state.rulesById).forEach((rule: RuleClientDTO) => {
        rule.tags.forEach((tag: RuleClientDTO['tags'][number]) => tags.add(tag.value));
      });
      return Array.from(tags).sort();
    },

    /** Count of active rules. 生效规则数量。 */
    activeRuleCount: (state): number =>
      Object.values(state.rulesById).filter((rule) => rule.status === 'Active').length,

    /** Whether current view has active filters. 当前视图是否存在活跃过滤条件。 */
    hasActiveFilter: (state): boolean =>
      state.filter.status !== null ||
      state.filter.severity !== null ||
      state.filter.tags.length > 0 ||
      state.searchQuery.length > 0,

    /** Current list query. 当前列表查询参数。 */
    currentListQuery(state): ListRulesQuery {
      return {
        status: state.filter.status ?? undefined,
        severity: state.filter.severity ?? undefined,
        tags: state.filter.tags.length > 0 ? state.filter.tags : undefined,
        page: state.pagination.page,
        pageSize: state.pagination.pageSize,
      };
    },
  },

  actions: {
    /** Upserts a single rule into cache. 将单个规则写入缓存。 */
    upsertRule(rule: RuleClientDTO) {
      this.rulesById = { ...this.rulesById, [rule.id]: rule };
    },

    /** Replaces current list result while preserving cached rules. 替换当前列表结果，同时保留已有缓存。 */
    setRules(rules: RuleClientDTO[], total?: number) {
      const nextById = { ...this.rulesById };
      const nextIds: string[] = [];
      for (const rule of rules) {
        nextById[rule.id] = rule;
        nextIds.push(rule.id);
      }
      this.rulesById = nextById;
      this.ruleIds = nextIds;
      if (total !== undefined) {
        this.pagination.total = total;
      }
    },

    /** Adds a rule to cache and current list head. 将规则加入缓存与当前列表头部。 */
    addRule(rule: RuleClientDTO) {
      this.upsertRule(rule);
      this.ruleIds = [rule.id, ...this.ruleIds.filter((id) => id !== rule.id)];
      this.pagination.total++;
    },

    /** Updates a cached rule. 更新缓存中的规则。 */
    updateRule(rule: RuleClientDTO) {
      this.upsertRule(rule);
      if (!this.ruleIds.includes(rule.id)) {
        this.ruleIds = [rule.id, ...this.ruleIds];
      }
    },

    /** Removes a rule from cache and current list. 从缓存和当前列表中移除规则。 */
    removeRule(ruleId: string) {
      const rest = { ...this.rulesById };
      delete rest[ruleId];
      this.rulesById = rest;
      this.ruleIds = this.ruleIds.filter((id) => id !== ruleId);
      this.pagination.total = Math.max(0, this.pagination.total - 1);
      if (this.currentRuleId === ruleId) {
        this.currentRuleId = null;
      }
    },

    /** Sets the current rule reference and caches it. 设置当前规则引用并写入缓存。 */
    setCurrentRule(rule: RuleClientDTO | null) {
      if (!rule) {
        this.currentRuleId = null;
        return;
      }
      this.upsertRule(rule);
      this.currentRuleId = rule.id;
    },

    /** Sets revision list for current rule. 设置当前规则的修订列表。 */
    setRevisions(revisions: RuleRevisionClientDTO[]) {
      this.revisions = revisions;
    },

    setFilterStatus(status: RuleStatus | null) {
      this.filter.status = status;
      this.pagination.page = 1;
    },

    setFilterSeverity(severity: RuleSeverity | null) {
      this.filter.severity = severity;
      this.pagination.page = 1;
    },

    setFilterTags(tags: string[]) {
      this.filter.tags = tags;
      this.pagination.page = 1;
    },

    toggleFilterTag(tag: string) {
      const index = this.filter.tags.indexOf(tag);
      if (index >= 0) {
        this.filter.tags.splice(index, 1);
      } else {
        this.filter.tags.push(tag);
      }
      this.pagination.page = 1;
    },

    clearFilters() {
      this.filter = { status: null, severity: null, tags: [] };
      this.searchQuery = '';
      this.pagination.page = 1;
    },

    setSearchQuery(query: string) {
      this.searchQuery = query;
      this.pagination.page = 1;
    },

    setPage(page: number) {
      this.pagination.page = page;
    },

    setPageSize(pageSize: number) {
      this.pagination.pageSize = pageSize;
      this.pagination.page = 1;
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setInitialized(initialized: boolean) {
      this.isInitialized = initialized;
    },

    reset() {
      this.$reset();
    },
  },

  persist: {
    pick: ['filter.status', 'filter.severity', 'pagination.pageSize'] as string[],
  },
});

export type GovernanceStoreType = ReturnType<typeof useGovernanceStore>;
