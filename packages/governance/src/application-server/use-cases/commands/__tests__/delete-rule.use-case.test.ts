import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import { ok, error } from '@dailyuse/contracts/result';
import { DeleteRuleUseCase } from '../delete-rule.use-case';
import type { ExecutionContext } from '../create-rule.use-case';
import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { DeleteRuleReq } from '../../../../contracts/api/rules';
import { RuleStatus } from '../../../../contracts/value-objects/rule-status';

// ============ Helpers ============

const testCx: ExecutionContext = { identityId: 'test-user-123' as any };

function createRuleFixture(
  overrides?: Partial<{ id: string; status: string; deprecate: ReturnType<typeof vi.fn> }>,
) {
  return {
    id: overrides?.id ?? 'rule-id-1',
    status: overrides?.status ?? RuleStatus.Draft,
    deprecate: overrides?.deprecate ?? vi.fn().mockReturnValue(ok(undefined)),
  } as any;
}

// ============ Tests ============

describe('DeleteRuleUseCase', () => {
  it('should hard delete a Draft rule', async () => {
    const rule = createRuleFixture({ status: RuleStatus.Draft });
    const deleteFn = vi.fn().mockResolvedValue(ok(undefined));
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(ok(rule)),
      delete: deleteFn,
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.success).toBe(true);
    expect(deleteFn).toHaveBeenCalledWith('rule-id-1');
  });

  it('should soft delete (deprecate) an Active rule', async () => {
    const deprecate = vi.fn().mockReturnValue(ok(undefined));
    const rule = createRuleFixture({ status: RuleStatus.Active, deprecate });
    const saveFn = vi.fn().mockResolvedValue(ok(undefined));
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(ok(rule)),
      save: saveFn,
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.success).toBe(true);
    expect(deprecate).toHaveBeenCalledWith(`Deleted by user ${testCx.identityId}`);
    expect(saveFn).toHaveBeenCalledWith(rule);
  });

  it('should return success when deleting an already Deprecated rule', async () => {
    const deprecate = vi.fn().mockReturnValue(error('INVALID_TRANSITION', 'Already deprecated'));
    const rule = createRuleFixture({ status: RuleStatus.Deprecated, deprecate });
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(ok(rule)),
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.success).toBe(true);
  });

  it('should return NOT_FOUND when rule does not exist', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(ok(null)),
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
      findById: vi.fn().mockResolvedValue(error('DB_ERROR', 'Database connection failed')),
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('DB_ERROR');
  });

  it('should return error when hard delete fails', async () => {
    const rule = createRuleFixture({ status: RuleStatus.Draft });
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(ok(rule)),
      delete: vi.fn().mockResolvedValue(error('DB_ERROR', 'Delete failed')),
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('DB_ERROR');
  });

  it('should return error when save after deprecate fails', async () => {
    const rule = createRuleFixture({ status: RuleStatus.Active });
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(ok(rule)),
      save: vi.fn().mockResolvedValue(error('DB_ERROR', 'Save failed')),
    });
    const useCase = new DeleteRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as DeleteRuleReq, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('DB_ERROR');
  });
});
