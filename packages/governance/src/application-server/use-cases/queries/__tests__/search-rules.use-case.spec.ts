import { describe, it, expect, vi } from 'vitest';
import { SearchRulesUseCase } from '../search-rules.use-case';
import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import { ok } from '@dailyuse/contracts/result';
import { RuleStatus } from '@/contracts/value-objects/rule-status';
import { RuleSeverity } from '@/contracts/value-objects/rule-severity';

function createRuleFixture(params: {
  id: string;
  code: string;
  title: string;
  description: string;
  status: typeof RuleStatus[keyof typeof RuleStatus];
  updatedAt: Date;
  tags?: string[];
}) {
  const tags = (params.tags ?? []).map((value) => ({ value, toDTO: () => ({ value }) }));
  return {
    id: params.id,
    code: params.code,
    title: params.title,
    description: params.description,
    severity: RuleSeverity.Recommended,
    status: params.status,
    deprecationReason: undefined,
    replacementRuleId: undefined,
    liveReferenceLocation: undefined,
    tags,
    goodExamples: [],
    badExamples: [],
    authorId: 'tester',
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    updatedAt: params.updatedAt,
  };
}

function createRepositoryMock(searchImpl: IRuleRepository['search']): IRuleRepository {
  return {
    search: searchImpl,
    save: vi.fn(),
    saveWithRevision: vi.fn(),
    findById: vi.fn(),
    findByCode: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
  } as unknown as IRuleRepository;
}

describe('SearchRulesUseCase', () => {
  it('orders results by relevance and status weight', async () => {
    const repository = createRepositoryMock(async () => ok([
      createRuleFixture({
        id: 'rule-1',
        code: 'DDD-200',
        title: 'Entity Props Pattern',
        description: 'Pattern for constructor props',
        status: RuleStatus.Draft,
        updatedAt: new Date('2026-02-10T00:00:00.000Z'),
      }),
      createRuleFixture({
        id: 'rule-2',
        code: 'DDD-201',
        title: 'Entity Props Pattern',
        description: 'Pattern for constructor props',
        status: RuleStatus.Active,
        updatedAt: new Date('2026-02-09T00:00:00.000Z'),
      }),
      createRuleFixture({
        id: 'rule-3',
        code: 'ARCH-001',
        title: 'Layer Isolation',
        description: 'Entity props used in examples',
        status: RuleStatus.Active,
        updatedAt: new Date('2026-02-11T00:00:00.000Z'),
      }),
    ]));

    const useCase = new SearchRulesUseCase(repository);
    const result = await useCase.execute('Entity Props Pattern');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.items.map((item) => item.id)).toEqual(['rule-2', 'rule-1', 'rule-3']);
    expect(result.data.total).toBe(3);
  });

  it('returns validation error for empty query', async () => {
    const repository = createRepositoryMock(async () => ok([]));
    const useCase = new SearchRulesUseCase(repository);

    const result = await useCase.execute('   ');

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('applies pagination to scored results', async () => {
    const repository = createRepositoryMock(async () => ok([
      createRuleFixture({
        id: 'rule-a',
        code: 'DDD-010',
        title: 'Factory Method Pattern',
        description: 'Factory method',
        status: RuleStatus.Active,
        updatedAt: new Date('2026-02-12T00:00:00.000Z'),
      }),
      createRuleFixture({
        id: 'rule-b',
        code: 'DDD-011',
        title: 'Factory Method Pattern',
        description: 'Factory method',
        status: RuleStatus.Draft,
        updatedAt: new Date('2026-02-11T00:00:00.000Z'),
      }),
      createRuleFixture({
        id: 'rule-c',
        code: 'DDD-012',
        title: 'Factory Method Pattern',
        description: 'Factory method',
        status: RuleStatus.Deprecated,
        updatedAt: new Date('2026-02-10T00:00:00.000Z'),
      }),
    ]));

    const useCase = new SearchRulesUseCase(repository);
    const result = await useCase.execute('Factory Method Pattern', { page: 2, pageSize: 1 });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.total).toBe(3);
    expect(result.data.page).toBe(2);
    expect(result.data.pageSize).toBe(1);
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0].id).toBe('rule-b');
  });
});