import { beforeEach, describe, expect, it } from 'vitest';
import type { RuleClientDTO } from '@dailyuse/contracts/governance';
import { createTestPinia } from '@dailyuse/test-utils';
import { useGovernanceStore } from './governance-store';

function createRule(overrides: Partial<RuleClientDTO> = {}): RuleClientDTO {
  return {
    id: 'RuleId_00000000-0000-0000-0000-000000000001' as RuleClientDTO['id'],
    code: 'GOV-001',
    title: 'Prefer intentional boundaries',
    description: 'Use module boundaries and explicit contracts to preserve clarity.',
    severity: 'Mandatory',
    status: 'Active',
    deprecationReason: null,
    replacementRuleId: null,
    liveReferenceLocation: null,
    tags: [{ value: 'architecture' }],
    goodExamples: [],
    badExamples: [],
    authorId: 'user-1' as RuleClientDTO['authorId'],
    createdAt: 1741910400000,
    updatedAt: 1741914000000,
    ...overrides,
  };
}

describe('useGovernanceStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('stores normalized POJO cache while preserving ordered list ids', () => {
    const store = useGovernanceStore();
    const first = createRule();
    const second = createRule({
      id: 'RuleId_00000000-0000-0000-0000-000000000002' as RuleClientDTO['id'],
      code: 'GOV-002',
      title: 'Keep routes resource-first',
    });

    store.setRules([first, second], 2);

    expect(store.ruleIds).toEqual([first.id, second.id]);
    expect(store.rulesById[first.id]?.title).toBe(first.title);
    expect(store.rules.map((rule) => rule.code)).toEqual(['GOV-001', 'GOV-002']);
  });

  it('upserts current rule into cache without losing list state', () => {
    const store = useGovernanceStore();
    const listed = createRule();
    const detail = createRule({
      id: listed.id,
      title: 'Prefer rich detail payloads',
      liveReferenceLocation: 'packages/governance/src/api/routes/governance-rules.routes.ts',
    });

    store.setRules([listed], 1);
    store.setCurrentRule(detail);

    expect(store.currentRuleId).toBe(listed.id);
    expect(store.currentRule?.title).toBe('Prefer rich detail payloads');
    expect(store.ruleIds).toEqual([listed.id]);
  });

  it('supports query helpers and active filter derivation from normalized cache', () => {
    const store = useGovernanceStore();
    const activeRule = createRule();
    const deprecatedRule = createRule({
      id: 'RuleId_00000000-0000-0000-0000-000000000002' as RuleClientDTO['id'],
      code: 'GOV-002',
      status: 'Deprecated',
      severity: 'Recommended',
      tags: [{ value: 'ui' }, { value: 'quality' }],
    });

    store.setRules([activeRule, deprecatedRule], 2);
    store.setFilterStatus('Active');
    store.setFilterSeverity('Mandatory');
    store.setFilterTags(['architecture']);
    store.setSearchQuery('boundary');

    expect(store.getRuleById(activeRule.id)?.code).toBe('GOV-001');
    expect(store.getRuleById('missing')).toBeNull();
    expect(store.getRulesByStatus('Deprecated').map((rule) => rule.id)).toEqual([deprecatedRule.id]);
    expect(store.getRulesBySeverity('Mandatory').map((rule) => rule.id)).toEqual([activeRule.id]);
    expect(store.getRulesByTag('ui').map((rule) => rule.id)).toEqual([deprecatedRule.id]);
    expect(store.allTags).toEqual(['architecture', 'quality', 'ui']);
    expect(store.activeRuleCount).toBe(1);
    expect(store.hasActiveFilter).toBe(true);
    expect(store.currentListQuery).toEqual({
      status: 'Active',
      severity: 'Mandatory',
      tags: ['architecture'],
      page: 1,
      pageSize: 20,
    });
  });

  it('adds updates removes and resets rules while keeping pagination coherent', () => {
    const store = useGovernanceStore();
    const first = createRule();
    const second = createRule({
      id: 'RuleId_00000000-0000-0000-0000-000000000002' as RuleClientDTO['id'],
      code: 'GOV-002',
      title: 'Document public interfaces',
    });
    const third = createRule({
      id: 'RuleId_00000000-0000-0000-0000-000000000003' as RuleClientDTO['id'],
      code: 'GOV-003',
      title: 'Preserve CI truth',
      severity: 'Recommended',
    });

    store.setRules([first], 1);
    store.setCurrentRule(first);
    store.addRule(second);
    store.updateRule(third);
    store.updateRule(
      createRule({
        id: first.id,
        title: 'Prefer explicit contracts',
      }),
    );

    expect(store.ruleIds).toEqual([third.id, second.id, first.id]);
    expect(store.pagination.total).toBe(2);
    expect(store.rulesById[first.id]?.title).toBe('Prefer explicit contracts');

    store.removeRule(second.id);
    expect(store.ruleIds).toEqual([third.id, first.id]);
    expect(store.pagination.total).toBe(1);

    store.removeRule(first.id);
    expect(store.currentRuleId).toBeNull();
    expect(store.pagination.total).toBe(0);

    store.reset();
    expect(store.rules).toEqual([]);
    expect(store.filter).toEqual({ status: null, severity: null, tags: [] });
    expect(store.pagination).toEqual({ page: 1, pageSize: 20, total: 0 });
    expect(store.isInitialized).toBe(false);
  });

  it('tracks revisions pagination and filter toggles from action updates', () => {
    const store = useGovernanceStore();
    const revision = {
      id: 'RuleRevisionId_00000000-0000-0000-0000-000000000001',
      ruleId: 'RuleId_00000000-0000-0000-0000-000000000001',
      version: 2,
      title: 'Rule revision',
      description: 'Updated rule wording.',
      changeSummary: 'Tightened examples.',
      changedById: 'user-2',
      createdAt: 1741917600000,
      formattedCreatedAt: '2026-03-14 10:00:00',
    };

    store.setPage(4);
    store.setPageSize(50);
    store.setFilterStatus('Active');
    store.setFilterSeverity('Recommended');
    store.setFilterTags(['ui']);
    store.toggleFilterTag('ui');
    store.toggleFilterTag('architecture');
    store.setLoading(true);
    store.setError('boom');
    store.setInitialized(true);
    store.setRevisions([revision as never]);

    expect(store.pagination).toEqual({ page: 1, pageSize: 50, total: 0 });
    expect(store.filter).toEqual({
      status: 'Active',
      severity: 'Recommended',
      tags: ['architecture'],
    });
    expect(store.revisions).toStrictEqual([revision]);
    expect(store.isLoading).toBe(true);
    expect(store.error).toBe('boom');
    expect(store.isInitialized).toBe(true);

    store.clearFilters();

    expect(store.filter).toEqual({ status: null, severity: null, tags: [] });
    expect(store.searchQuery).toBe('');
    expect(store.hasActiveFilter).toBe(false);
  });
});
