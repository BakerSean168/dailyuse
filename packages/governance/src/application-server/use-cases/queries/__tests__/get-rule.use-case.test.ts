import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import { GetRuleUseCase } from '../get-rule.use-case';
import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { GetRuleReq } from '../../../../contracts/api/rules';
import { RuleStatus } from '../../../../contracts/value-objects/rule-status';
import { RuleSeverity } from '../../../../contracts/value-objects/rule-severity';

// ============ Helpers ============

function createRuleFixture(overrides?: Record<string, any>) {
  const fixture = {
    id: 'rule-id-1',
    code: 'DDD-001',
    title: 'Use Aggregates',
    description: 'Always use aggregate roots for domain modeling.',
    severity: RuleSeverity.Recommended,
    status: RuleStatus.Active,
    deprecationReason: null,
    replacementRuleId: null,
    liveReferenceLocation: null,
    tags: [{ value: 'ddd', toDTO: () => ({ value: 'ddd' }) }],
    goodExamples: [
      { toDTO: () => ({ language: 'TypeScript', content: 'const x = 1;', type: 'GoodExample' }) },
    ],
    badExamples: [
      { toDTO: () => ({ language: 'TypeScript', content: 'let x = 1;', type: 'BadExample' }) },
    ],
    authorId: 'author-123',
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-10T00:00:00.000Z'),
    ...overrides,
  };
  fixture.toClientDTO = () => ({
    id: fixture.id,
    code: fixture.code,
    title: fixture.title,
    description: fixture.description,
    severity: fixture.severity,
    status: fixture.status,
    deprecationReason: fixture.deprecationReason,
    replacementRuleId: fixture.replacementRuleId,
    liveReferenceLocation: fixture.liveReferenceLocation,
    tags: fixture.tags.map((tag: any) => tag.toDTO()),
    goodExamples: fixture.goodExamples.map((ex: any) => ex.toDTO()),
    badExamples: fixture.badExamples.map((ex: any) => ex.toDTO()),
    authorId: fixture.authorId,
    createdAt: fixture.createdAt.getTime(),
    updatedAt: fixture.updatedAt.getTime(),
  });
  return fixture as any;
}

// ============ Tests ============

describe('GetRuleUseCase', () => {
  it('should get a rule by ID and return DTO', async () => {
    const rule = createRuleFixture();
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
    });
    const useCase = new GetRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as GetRuleReq);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.id).toBe('rule-id-1');
    expect(result.data.code).toBe('DDD-001');
    expect(result.data.title).toBe('Use Aggregates');
    expect(result.data.severity).toBe(RuleSeverity.Recommended);
    expect(result.data.status).toBe(RuleStatus.Active);
    expect(result.data.tags).toHaveLength(1);
    expect(result.data.goodExamples).toHaveLength(1);
    expect(result.data.badExamples).toHaveLength(1);
    expect(result.data.authorId).toBe('author-123');
    expect(result.data.createdAt).toBe(new Date('2026-02-01T00:00:00.000Z').getTime());
    expect(result.data.updatedAt).toBe(new Date('2026-02-10T00:00:00.000Z').getTime());
  });

  it('should get a rule by code', async () => {
    const rule = createRuleFixture();
    const findByCode = vi.fn().mockResolvedValue(rule);
    const ruleRepo = createMockRepo<IRuleRepository>({
      findByCode,
    });
    const useCase = new GetRuleUseCase(ruleRepo);

    const result = await useCase.execute({ code: 'DDD-001' } as GetRuleReq);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.code).toBe('DDD-001');
    expect(findByCode).toHaveBeenCalledWith('DDD-001');
  });

  it('should prefer ID over code when both are provided', async () => {
    const rule = createRuleFixture();
    const findById = vi.fn().mockResolvedValue(rule);
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById,
    });
    const useCase = new GetRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1', code: 'DDD-001' } as GetRuleReq);

    expect(result.ok).toBe(true);
    expect(findById).toHaveBeenCalledWith('rule-id-1');
  });

  it('should return BAD_REQUEST when neither id nor code is provided', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>();
    const useCase = new GetRuleUseCase(ruleRepo);

    const result = await useCase.execute({} as GetRuleReq);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('BAD_REQUEST');
    expect(result.error.message).toContain('id or code');
  });

  it('should return NOT_FOUND when rule does not exist by ID', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(null),
    });
    const useCase = new GetRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'nonexistent-id' } as GetRuleReq);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
    expect(result.error.message).toContain("ID 'nonexistent-id'");
  });

  it('should return NOT_FOUND when rule does not exist by code', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findByCode: vi.fn().mockResolvedValue(null),
    });
    const useCase = new GetRuleUseCase(ruleRepo);

    const result = await useCase.execute({ code: 'UNKNOWN-999' } as GetRuleReq);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
    expect(result.error.message).toContain("code 'UNKNOWN-999'");
  });

  it('should propagate repository errors', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockRejectedValue(new Error('Connection failed')),
    });
    const useCase = new GetRuleUseCase(ruleRepo);

    const result = await useCase.execute({ id: 'rule-id-1' } as GetRuleReq);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });
});
