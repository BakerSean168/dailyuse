/**
 * Governance Store - Pinia 状态管理（UI state only）
 *
 * RefArch Phase 5（Governance Query Cache authority pilot）后，Governance 的 server state
 * （rules list/detail/revisions、total、loading、error）由 TanStack Vue Query 承载；本 store
 * 只保留 searchQuery/filter/pagination page/pageSize 等 UI state 及其持久化。
 */

import { defineStore } from 'pinia';
import type { RuleSeverity, RuleStatus } from '@memoflow/contracts/governance';

export interface GovernanceState {
  /** Search query. 搜索关键词。 */
  searchQuery: string;
  /** Filters. 过滤条件。 */
  filter: {
    status: RuleStatus | null;
    severity: RuleSeverity | null;
    tags: string[];
  };
  /** Pagination UI state (page/pageSize only; total lives in the query cache). 分页 UI 状态。 */
  pagination: {
    page: number;
    pageSize: number;
  };
}

export const useGovernanceStore = defineStore('governance', {
  state: (): GovernanceState => ({
    searchQuery: '',
    filter: {
      status: null,
      severity: null,
      tags: [],
    },
    pagination: {
      page: 1,
      pageSize: 20,
    },
  }),

  getters: {
    /** Whether current view has active filters. 当前视图是否存在活跃过滤条件。 */
    hasActiveFilter: (state): boolean =>
      state.filter.status !== null ||
      state.filter.severity !== null ||
      state.filter.tags.length > 0 ||
      state.searchQuery.length > 0,
  },

  actions: {
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

    reset() {
      this.$reset();
    },
  },

  persist: {
    pick: ['filter.status', 'filter.severity', 'pagination.pageSize'] as string[],
  },
});

export type GovernanceStoreType = ReturnType<typeof useGovernanceStore>;
