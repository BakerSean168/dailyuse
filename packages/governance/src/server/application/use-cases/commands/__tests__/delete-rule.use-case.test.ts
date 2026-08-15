import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils';
import { ok, error } from '@memoflow/contracts/result';
import { DeleteRuleUseCase } from '../delete-rule.use-case';
import type { ExecutionContext } from '../../execution-context';
import type { IRuleRepository } from '../../../../domain/repositories/i-rule-repository';
import type { DeleteRuleReq } from '@memoflow/contracts/governance';
import { RuleStatus } from '@memoflow/contracts/governance';

// ============ Helpers ============

const testCx: ExecutionContext = {
  requestId: 'req-governance-test',
  traceId: 'req-governance-test',
  startedAt: 1_700_000_000_000,
  source: 'ipc',
  identityId: 'test-user-123',
  deviceId: 'desktop-test',
};

type DeleteRuleFixture = NonNullable<Awaited<ReturnType<IRuleRepository['findById']>>>;

function createRuleFixture(
  overrides?: Partial<{ id: string; status: string; deprecate: ReturnType<typeof vi.fn> }>,
) {
  return {
    id: overrides?.id ?? 'rule-id-1',
    status: overrides?.status ?? RuleStatus.Draft,
    deprecate: overrides?.deprecate ?? vi.fn().mockReturnValue(ok(undefined)),
  } as unknown as DeleteRuleFixture;
}

// ============ Tests ============

describe('DeleteRuleUseCase', () => {
  it('should hard delete a Draft rule', async () => {
    const rule = createRuleFixture({ status: RuleStatus.Draft });
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
      delete: deleteFn,
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toBeNull();
    expect(deleteFn).toHaveBeenCalledWith('rule-id-1');
  });

  it('should soft delete (deprecate) an Active rule', async () => {
    const deprecate = vi.fn().mockReturnValue(ok(undefined));
    const rule = createRuleFixture({ status: RuleStatus.Active, deprecate });
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
      save: saveFn,
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toBeNull();
    expect(deprecate).toHaveBeenCalledWith(`Deleted by user ${testCx.identityId}`);
    expect(saveFn).toHaveBeenCalledWith(rule);
  });

  it('should return success when deleting an already Deprecated rule', async () => {
    const deprecate = vi.fn().mockReturnValue(error('INVALID_TRANSITION', 'Already deprecated'));
    const rule = createRuleFixture({ status: RuleStatus.Deprecated, deprecate });
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toBeNull();
  });

  it('should return NOT_FOUND when rule does not exist', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(null),
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'nonexistent-id' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
    expect(result.error.message).toContain('nonexistent-id');
  });

  it('should return error when findById fails', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });

  it('should return error when hard delete fails', async () => {
    const rule = createRuleFixture({ status: RuleStatus.Draft });
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
      delete: vi.fn().mockRejectedValue(new Error('Delete failed')),
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });

  it('should return error when save after deprecate fails', async () => {
    const rule = createRuleFixture({ status: RuleStatus.Active });
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
      save: vi.fn().mockRejectedValue(new Error('Save failed')),
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });
});
