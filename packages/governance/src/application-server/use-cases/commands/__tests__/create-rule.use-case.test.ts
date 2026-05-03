import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import { CreateRuleUseCase } from '../create-rule.use-case';
import type { ExecutionContext } from '../../execution-context';
import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { IRuleRevisionRepository } from '@/domain-server/repositories/i-rule-revision-repository';
import type { CreateRuleReq } from '../../../../contracts/api/rules';

// ============ Helpers ============

const testCx: ExecutionContext = { identityId: 'test-user-123' as any };

function validReq(overrides?: Partial<CreateRuleReq>): CreateRuleReq {
  return {
    code: 'DDD-001',
    title: 'Use Aggregates',
    description: 'Always use aggregate roots for domain modeling.',
    severity: 'Recommended',
    tags: ['ddd'],
    goodExamples: [{ language: 'TypeScript', content: 'const x = 1;' }],
    badExamples: [{ language: 'TypeScript', content: 'let x = 1;' }],
    ...overrides,
  };
}

// ============ Tests ============

describe('CreateRuleUseCase', () => {
  it('should create a rule successfully and return DTO', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findByCode: vi.fn().mockResolvedValue(null),
      saveWithRevision: vi.fn().mockResolvedValue(undefined),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      countByRuleId: vi.fn().mockResolvedValue(0),
    });
    const useCase = new CreateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(validReq(), testCx);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.code).toBe('DDD-001');
    expect(result.data.title).toBe('Use Aggregates');
    expect(result.data.severity).toBe('Recommended');
    expect(result.data.status).toBe('Draft');
    expect(result.data.tags).toHaveLength(1);
    expect(result.data.goodExamples).toHaveLength(1);
    expect(result.data.badExamples).toHaveLength(1);
    expect(result.data.authorId).toBe('test-user-123');
  });

  it('should call saveWithRevision on the repository', async () => {
    const saveWithRevision = vi.fn().mockResolvedValue(undefined);
    const ruleRepo = createMockRepo<IRuleRepository>({
      findByCode: vi.fn().mockResolvedValue(null),
      saveWithRevision,
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      countByRuleId: vi.fn().mockResolvedValue(0),
    });
    const useCase = new CreateRuleUseCase(ruleRepo, revisionRepo);

    await useCase.execute(validReq(), testCx);

    expect(saveWithRevision).toHaveBeenCalledTimes(1);
  });

  it('should return DUPLICATE_CODE when code already exists', async () => {
    const existingRule = {} as any; // non-null means existing
    const ruleRepo = createMockRepo<IRuleRepository>({
      findByCode: vi.fn().mockResolvedValue(existingRule),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>();
    const useCase = new CreateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(validReq(), testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('DUPLICATE_CODE');
    expect(result.error.message).toContain('DDD-001');
  });

  it('should return error when findByCode fails', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findByCode: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>();
    const useCase = new CreateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(validReq(), testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });

  it('should return error for invalid severity', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findByCode: vi.fn().mockResolvedValue(null),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>();
    const useCase = new CreateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(validReq({ severity: 'Invalid' as any }), testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return error for invalid language in examples', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findByCode: vi.fn().mockResolvedValue(null),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>();
    const useCase = new CreateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(
      validReq({ goodExamples: [{ language: 'InvalidLang', content: 'code' }] }),
      testCx,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return error when saveWithRevision fails', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findByCode: vi.fn().mockResolvedValue(null),
      saveWithRevision: vi.fn().mockRejectedValue(new Error('Save failed')),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      countByRuleId: vi.fn().mockResolvedValue(0),
    });
    const useCase = new CreateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(validReq(), testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });

  it('should return error when countByRuleId fails', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findByCode: vi.fn().mockResolvedValue(null),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      countByRuleId: vi.fn().mockRejectedValue(new Error('Count failed')),
    });
    const useCase = new CreateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(validReq(), testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });
});
