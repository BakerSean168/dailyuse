import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { RuleClientDTO } from '../types';
import { useGovernanceStore } from './governanceStore';

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
    setActivePinia(createPinia());
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
});
