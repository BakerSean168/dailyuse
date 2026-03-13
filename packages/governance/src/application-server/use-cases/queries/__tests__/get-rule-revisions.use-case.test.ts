import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import { ok, error } from '@dailyuse/contracts/result';
import { GetRuleRevisionsUseCase } from '../get-rule-revisions.use-case';
import type { IRuleRevisionRepository } from '@/domain-server/repositories/i-rule-revision-repository';
import type { GetRuleRevisionsQuery } from '../../../../contracts/api/rule-revisions';

// ============ Helpers ============

function createRevisionFixture(overrides?: Record<string, any>) {
  return {
    id: overrides?.id ?? 'rev-id-1',
    ruleId: overrides?.ruleId ?? 'rule-id-1',
    revisionNumber: overrides?.revisionNumber ?? 1,
    toClientDTO: vi.fn().mockReturnValue({
      id: overrides?.id ?? 'rev-id-1',
      ruleId: overrides?.ruleId ?? 'rule-id-1',
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
      createRevisionFixture({ id: 'rev-1', revisionNumber: 1 }),
      createRevisionFixture({ id: 'rev-2', revisionNumber: 2 }),
      createRevisionFixture({ id: 'rev-3', revisionNumber: 3 }),
    ];
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      findByRuleId: vi.fn().mockResolvedValue(ok(revisions)),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({ ruleId: 'rule-id-1' } as GetRuleRevisionsQuery);

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
      findByRuleId: vi.fn().mockResolvedValue(ok(revisions)),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({ ruleId: 'rule-id-1' } as GetRuleRevisionsQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.page).toBe(1);
    expect(result.data.pageSize).toBe(20);
    expect(result.data.total).toBe(1);
  });

  it('should paginate results correctly', async () => {
    const revisions = Array.from({ length: 5 }, (_, i) =>
      createRevisionFixture({ id: `rev-${i + 1}`, revisionNumber: i + 1 }),
    );
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      findByRuleId: vi.fn().mockResolvedValue(ok(revisions)),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({
      ruleId: 'rule-id-1',
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
      findByRuleId: vi.fn().mockResolvedValue(ok([])),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({ ruleId: 'rule-id-1' } as GetRuleRevisionsQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(0);
    expect(result.data.total).toBe(0);
  });

  it('should call toClientDTO on each revision', async () => {
    const revision = createRevisionFixture();
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      findByRuleId: vi.fn().mockResolvedValue(ok([revision])),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({ ruleId: 'rule-id-1' } as GetRuleRevisionsQuery);

    expect(result.ok).toBe(true);
    expect(revision.toClientDTO).toHaveBeenCalledTimes(1);
  });

  it('should propagate repository errors', async () => {
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      findByRuleId: vi.fn().mockResolvedValue(error('INTERNAL_ERROR', 'Connection failed')),
    });
    const useCase = new GetRuleRevisionsUseCase(revisionRepo);

    const result = await useCase.execute({ ruleId: 'rule-id-1' } as GetRuleRevisionsQuery);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });
});
