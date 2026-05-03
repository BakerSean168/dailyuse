import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import { GetRuleRevisionsUseCase } from '../get-rule-revisions.use-case';
import type { IRuleRevisionRepository } from '@/domain-server/repositories/i-rule-revision-repository';
import type { GetRuleRevisionsQuery } from '../../../../contracts/api/rule-revisions';
import type { RuleId } from '../../../../contracts/primitives/ids';

// ============ Constants ============

const TEST_RULE_ID = 'RuleId_550e8400-e29b-41d4-a716-446655440000' as RuleId;

// ============ Helpers ============

function createRevisionFixture(overrides?: Record<string, any>) {
  return {
    id: overrides?.id ?? 'RuleRevisionId_00000000-0000-0000-0000-000000000001',
    ruleId: overrides?.ruleId ?? TEST_RULE_ID,
    revisionNumber: overrides?.revisionNumber ?? 1,
    toClientDTO: vi.fn().mockReturnValue({
      id: overrides?.id ?? 'RuleRevisionId_00000000-0000-0000-0000-000000000001',
      ruleId: overrides?.ruleId ?? TEST_RULE_ID,
      revisionNumber: overrides?.revisionNumber ?? 1,
      changedFields: overrides?.changedFields ?? ['title'],
      createdAt: overrides?.createdAt ?? Date.now(),
    }),
  } as any;
}

// ============ Tests ============

describe('GetRuleRevisionsUseCase', () => {
  it('should return revisions sorted by revision number descending', async () => {
    const revisions = [
      createRevisionFixture({
        id: 'RuleRevisionId_00000000-0000-0000-0000-000000000011',
        revisionNumber: 1,
      }),
      createRevisionFixture({
        id: 'RuleRevisionId_00000000-0000-0000-0000-000000000012',
        revisionNumber: 2,
      }),
      createRevisionFixture({
        id: 'RuleRevisionId_00000000-0000-0000-0000-000000000013',
        revisionNumber: 3,
      }),
    ];
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      findByRuleId: vi.fn().mockResolvedValue(revisions),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({ ruleId: TEST_RULE_ID } as GetRuleRevisionsQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(3);
    // Verify sorted descending: 3, 2, 1
    expect(result.data.items[0].revisionNumber).toBe(3);
    expect(result.data.items[1].revisionNumber).toBe(2);
    expect(result.data.items[2].revisionNumber).toBe(1);
  });

  it('should apply default pagination', async () => {
    const revisions = [createRevisionFixture()];
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      findByRuleId: vi.fn().mockResolvedValue(revisions),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({ ruleId: TEST_RULE_ID } as GetRuleRevisionsQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.page).toBe(1);
    expect(result.data.pageSize).toBe(20);
    expect(result.data.total).toBe(1);
  });

  it('should paginate results correctly', async () => {
    const revisions = Array.from({ length: 5 }, (_, i) =>
      createRevisionFixture({
        id: `RuleRevisionId_00000000-0000-0000-0000-00000000002${i + 1}`,
        revisionNumber: i + 1,
      }),
    );
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      findByRuleId: vi.fn().mockResolvedValue(revisions),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({
      ruleId: TEST_RULE_ID,
      page: 2,
      pageSize: 2,
    } as GetRuleRevisionsQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.total).toBe(5);
    expect(result.data.page).toBe(2);
    expect(result.data.pageSize).toBe(2);
    expect(result.data.items).toHaveLength(2);
    // Sorted descending: [5,4,3,2,1], page 2 size 2 = [3,2]
    expect(result.data.items[0].revisionNumber).toBe(3);
    expect(result.data.items[1].revisionNumber).toBe(2);
  });

  it('should return empty list when no revisions exist', async () => {
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      findByRuleId: vi.fn().mockResolvedValue([]),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({ ruleId: TEST_RULE_ID } as GetRuleRevisionsQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(0);
    expect(result.data.total).toBe(0);
  });

  it('should call toClientDTO on each revision', async () => {
    const revision = createRevisionFixture();
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      findByRuleId: vi.fn().mockResolvedValue([revision]),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({ ruleId: TEST_RULE_ID } as GetRuleRevisionsQuery);

    expect(result.ok).toBe(true);
    expect(revision.toClientDTO).toHaveBeenCalledTimes(1);
  });

  it('should propagate repository errors', async () => {
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      findByRuleId: vi.fn().mockRejectedValue(new Error('Connection failed')),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({ ruleId: TEST_RULE_ID } as GetRuleRevisionsQuery);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });
});
