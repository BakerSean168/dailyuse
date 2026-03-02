import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import { ok, error } from '@dailyuse/contracts/result';
import { ListRulesUseCase } from '../list-rules.use-case';
import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { ListRulesQuery } from '../../../../contracts/api/rules';
import { RuleStatus } from '../../../../contracts/value-objects/rule-status';
import { RuleSeverity } from '../../../../contracts/value-objects/rule-severity';

// ============ Helpers ============

function createRuleFixture(overrides?: Record<string, any>) {
  return {
    id: overrides?.id ?? 'rule-id-1',
    code: overrides?.code ?? 'DDD-001',
    title: overrides?.title ?? 'Use Aggregates',
    description: 'Always use aggregate roots for domain modeling.',
    severity: overrides?.severity ?? RuleSeverity.Recommended,
    status: overrides?.status ?? RuleStatus.Active,
    deprecationReason: undefined,
    replacementRuleId: undefined,
    liveReferenceLocation: undefined,
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
  } as any;
}

// ============ Tests ============

describe('ListRulesUseCase', () => {
  it('should list all rules with default pagination', async () => {
    const rules = [
      createRuleFixture({ id: 'rule-1', code: 'DDD-001' }),
      createRuleFixture({ id: 'rule-2', code: 'DDD-002' }),
      createRuleFixture({ id: 'rule-3', code: 'DDD-003' }),
    ];
    const ruleRepo = createMockRepo<IRuleRepository>({
      findAll: vi.fn().mockResolvedValue(ok(rules)),
    });
    const useCase = new ListRulesUseCase(ruleRepo);

    const result = await useCase.execute({} as ListRulesQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(3);
    expect(result.data.total).toBe(3);
    expect(result.data.page).toBe(1);
    expect(result.data.pageSize).toBe(20);
  });

  it('should apply status filter', async () => {
    const findAll = vi.fn().mockResolvedValue(ok([]));
    const ruleRepo = createMockRepo<IRuleRepository>({ findAll });
    const useCase = new ListRulesUseCase(ruleRepo);

    await useCase.execute({ status: RuleStatus.Active } as ListRulesQuery);

    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ status: RuleStatus.Active }));
  });

  it('should apply severity filter', async () => {
    const findAll = vi.fn().mockResolvedValue(ok([]));
    const ruleRepo = createMockRepo<IRuleRepository>({ findAll });
    const useCase = new ListRulesUseCase(ruleRepo);

    await useCase.execute({ severity: RuleSeverity.Mandatory } as ListRulesQuery);

    expect(findAll).toHaveBeenCalledWith(
      expect.objectContaining({ severity: RuleSeverity.Mandatory }),
    );
  });

  it('should apply tags filter', async () => {
    const findAll = vi.fn().mockResolvedValue(ok([]));
    const ruleRepo = createMockRepo<IRuleRepository>({ findAll });
    const useCase = new ListRulesUseCase(ruleRepo);

    await useCase.execute({ tags: ['ddd', 'architecture'] } as ListRulesQuery);

    expect(findAll).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['ddd', 'architecture'] }),
    );
  });

  it('should paginate results correctly', async () => {
    const rules = Array.from({ length: 5 }, (_, i) =>
      createRuleFixture({ id: `rule-${i + 1}`, code: `DDD-00${i + 1}` }),
    );
    const ruleRepo = createMockRepo<IRuleRepository>({
      findAll: vi.fn().mockResolvedValue(ok(rules)),
    });
    const useCase = new ListRulesUseCase(ruleRepo);

    const result = await useCase.execute({ page: 2, pageSize: 2 } as ListRulesQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(2);
    expect(result.data.total).toBe(5);
    expect(result.data.page).toBe(2);
    expect(result.data.pageSize).toBe(2);
    expect(result.data.items[0].id).toBe('rule-3');
    expect(result.data.items[1].id).toBe('rule-4');
  });

  it('should return empty list when no rules match', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findAll: vi.fn().mockResolvedValue(ok([])),
    });
    const useCase = new ListRulesUseCase(ruleRepo);

    const result = await useCase.execute({} as ListRulesQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items).toHaveLength(0);
    expect(result.data.total).toBe(0);
  });

  it('should map rules to client DTOs', async () => {
    const rules = [createRuleFixture()];
    const ruleRepo = createMockRepo<IRuleRepository>({
      findAll: vi.fn().mockResolvedValue(ok(rules)),
    });
    const useCase = new ListRulesUseCase(ruleRepo);

    const result = await useCase.execute({} as ListRulesQuery);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const dto = result.data.items[0];
    expect(dto.id).toBe('rule-id-1');
    expect(dto.code).toBe('DDD-001');
    expect(dto.title).toBe('Use Aggregates');
    expect(dto.tags).toEqual([{ value: 'ddd' }]);
    expect(typeof dto.createdAt).toBe('number');
    expect(typeof dto.updatedAt).toBe('number');
  });

  it('should propagate repository errors', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findAll: vi.fn().mockResolvedValue(error('DB_ERROR', 'Connection failed')),
    });
    const useCase = new ListRulesUseCase(ruleRepo);

    const result = await useCase.execute({} as ListRulesQuery);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('DB_ERROR');
  });
});
