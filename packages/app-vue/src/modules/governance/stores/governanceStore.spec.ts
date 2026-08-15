import { beforeEach, describe, expect, it } from 'vitest';
import { createTestPinia } from '@memoflow/test-utils';
import { useGovernanceStore } from './governance-store';

describe('useGovernanceStore (UI state only after Query Cache authority pilot)', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('manages search / filter / pagination page/pageSize UI state', () => {
    const store = useGovernanceStore();
    expect(store.pagination).toEqual({ page: 1, pageSize: 20 });
    expect(store.filter).toEqual({ status: null, severity: null, tags: [] });
    expect(store.searchQuery).toBe('');
    expect(store.hasActiveFilter).toBe(false);

    store.setFilterStatus('Active');
    store.setFilterSeverity('Mandatory');
    store.setFilterTags(['architecture']);
    store.setSearchQuery('boundary');
    store.setPage(4);
    store.setPageSize(50);

    expect(store.pagination).toEqual({ page: 1, pageSize: 50 });
    expect(store.filter).toEqual({
      status: 'Active',
      severity: 'Mandatory',
      tags: ['architecture'],
    });
    expect(store.hasActiveFilter).toBe(true);

    store.clearFilters();
    expect(store.filter).toEqual({ status: null, severity: null, tags: [] });
    expect(store.searchQuery).toBe('');
    expect(store.hasActiveFilter).toBe(false);
  });

  it('holds no server DTO / list / detail / revisions / loading / error / total fields', () => {
    const store = useGovernanceStore();
    expect(store).not.toHaveProperty('rulesById');
    expect(store).not.toHaveProperty('ruleIds');
    expect(store).not.toHaveProperty('currentRuleId');
    expect(store).not.toHaveProperty('revisions');
    expect(store).not.toHaveProperty('isLoading');
    expect(store).not.toHaveProperty('error');
    expect(store).not.toHaveProperty('isInitialized');
    expect(store.pagination).not.toHaveProperty('total');
  });

  it('resets to defaults via reset()', () => {
    const store = useGovernanceStore();
    store.setFilterStatus('Deprecated');
    store.setFilterTags(['ui', 'quality']);
    store.setSearchQuery('CI');
    store.setPageSize(100);
    store.setPage(3);

    store.reset();

    expect(store.pagination).toEqual({ page: 1, pageSize: 20 });
    expect(store.filter).toEqual({ status: null, severity: null, tags: [] });
    expect(store.searchQuery).toBe('');
  });
});
