/**
 * Governance Store - Pinia State Management
 *
 * 治理规则模块的状态管理。
 * 纯状态容器 — API 调用由 composables 执行。
 */

import { defineStore } from 'pinia';
import type {
  RuleClientDTO,
  RuleRevisionClientDTO,
  RuleStatus,
  RuleSeverity,
  ListRulesQuery,
} from '../../types';

// ============ State ============

export interface GovernanceState {
  /** 规则列表 */
  rules: RuleClientDTO[];
  /** 当前查看的规则 */
  currentRule: RuleClientDTO | null;
  /** 当前规则的修订历史 */
  revisions: RuleRevisionClientDTO[];
  /** 加载状态 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 搜索关键词 */
  searchQuery: string;
  /** 过滤条件 */
  filter: {
    status: RuleStatus | null;
    severity: RuleSeverity | null;
    tags: string[];
  };
  /** 分页 */
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  /** 是否已初始化 */
  isInitialized: boolean;
}

// ============ Store ============

export const useGovernanceStore = defineStore('governance', {
  state: (): GovernanceState => ({
    rules: [],
    currentRule: null,
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
    /** 根据 ID 查找规则 */
    getRuleById: (state) => (id: string) =>
      state.rules.find((rule) => rule.id === id),

    /** 根据状态过滤规则 */
    getRulesByStatus: (state) => (status: RuleStatus) =>
      state.rules.filter((rule) => rule.status === status),

    /** 根据标签过滤规则 */
    getRulesByTag: (state) => (tag: string) =>
      state.rules.filter((rule) => rule.tags.includes(tag)),

    /** 根据严重级别过滤 */
    getRulesBySeverity: (state) => (severity: RuleSeverity) =>
      state.rules.filter((rule) => rule.severity === severity),

    /** 所有唯一标签 */
    allTags: (state): string[] => {
      const tags = new Set<string>();
      state.rules.forEach((rule) => rule.tags.forEach((tag) => tags.add(tag)));
      return Array.from(tags).sort();
    },

    /** 活跃规则数量 */
    activeRuleCount: (state): number =>
      state.rules.filter((r) => r.status === 'Active').length,

    /** 当前是否有过滤条件 */
    hasActiveFilter: (state): boolean =>
      state.filter.status !== null ||
      state.filter.severity !== null ||
      state.filter.tags.length > 0 ||
      state.searchQuery.length > 0,

    /** 当前过滤/搜索后的查询参数 */
    currentListQuery(state): ListRulesQuery {
      return {
        status: state.filter.status ?? undefined,
        severity: state.filter.severity ?? undefined,
        tags: state.filter.tags.length > 0 ? this.filter.tags : undefined,
        page: state.pagination.page,
        pageSize: state.pagination.pageSize,
      };
    },
  },

  actions: {
    // ===== 规则列表操作 =====

    setRules(rules: RuleClientDTO[], total?: number) {
      this.rules = rules;
      if (total !== undefined) {
        this.pagination.total = total;
      }
    },

    addRule(rule: RuleClientDTO) {
      this.rules.unshift(rule);
      this.pagination.total++;
    },

    updateRule(rule: RuleClientDTO) {
      const index = this.rules.findIndex((item) => item.id === rule.id);
      if (index !== -1) {
        this.rules[index] = rule;
      }
      if (this.currentRule?.id === rule.id) {
        this.currentRule = rule;
      }
    },

    removeRule(ruleId: string) {
      this.rules = this.rules.filter((rule) => rule.id !== ruleId);
      this.pagination.total--;
      if (this.currentRule?.id === ruleId) {
        this.currentRule = null;
      }
    },

    // ===== 当前规则 =====

    setCurrentRule(rule: RuleClientDTO | null) {
      this.currentRule = rule;
    },

    // ===== 修订历史 =====

    setRevisions(revisions: RuleRevisionClientDTO[]) {
      this.revisions = revisions;
    },

    // ===== 过滤 =====

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
      const idx = this.filter.tags.indexOf(tag);
      if (idx >= 0) {
        this.filter.tags.splice(idx, 1);
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

    // ===== 搜索 =====

    setSearchQuery(query: string) {
      this.searchQuery = query;
      this.pagination.page = 1;
    },

    // ===== 分页 =====

    setPage(page: number) {
      this.pagination.page = page;
    },

    setPageSize(pageSize: number) {
      this.pagination.pageSize = pageSize;
      this.pagination.page = 1;
    },

    // ===== UI 状态 =====

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setInitialized(initialized: boolean) {
      this.isInitialized = initialized;
    },

    // ===== 重置 =====

    reset() {
      this.$reset();
    },
  },

  persist: {
    pick: ['filter.status', 'filter.severity', 'pagination.pageSize'] as string[],
  },
});

export type GovernanceStoreType = ReturnType<typeof useGovernanceStore>;
