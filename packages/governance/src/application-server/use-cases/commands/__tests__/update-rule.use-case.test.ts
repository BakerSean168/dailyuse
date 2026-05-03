import { vi, describe, it, expect } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils';
import { UpdateRuleUseCase } from '../update-rule.use-case';
import type { ExecutionContext } from '../../execution-context';
import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { IRuleRevisionRepository } from '@/domain-server/repositories/i-rule-revision-repository';
import { Rule } from '@/domain-server/aggregates/rule';
import type { RuleState } from '@/domain-server/aggregates/rule';
import { RuleStatus } from '@/domain-shared/value-objects/rule-status';
import { RuleSeverity } from '@/domain-shared/value-objects/rule-severity';
import { RuleTag } from '@/domain-shared/value-objects/rule-tag';
import { CodeSnippet } from '@/domain-shared/value-objects/code-snippet';
import { Language } from '@/domain-shared/value-objects/language';
import { RuleId } from '@/domain-shared/value-objects/rule-id';

// ============ Helpers ============

const testCx: ExecutionContext = { identityId: 'test-user-123' as any };

function createTestRule(overrides?: Partial<RuleState>): Rule {
  const goodSnippet = CodeSnippet.create({
    language: Language.TypeScript,
    content: 'const x = 1;',
    type: 'GoodExample',
    caption: null,
  });
  const badSnippet = CodeSnippet.create({
    language: Language.TypeScript,
    content: 'let x = 1;',
    type: 'BadExample',
    caption: null,
  });
  return Rule.load({
    id: RuleId.generate(),
    code: 'DDD-001',
    title: 'Original Title',
    description: 'A valid description for testing purposes',
    severity: RuleSeverity.Recommended,
    status: RuleStatus.Active,
    tags: [RuleTag.fromDTO({ value: 'ddd' })],
    codeSnippets: [
      goodSnippet.ok ? goodSnippet.data : null!,
      badSnippet.ok ? badSnippet.data : null!,
    ],
    authorId: 'test-author' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

// ============ Tests ============

describe('UpdateRuleUseCase', () => {
  it('should update rule title and return DTO', async () => {
    const rule = createTestRule();
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
      saveWithRevision: vi.fn().mockResolvedValue(undefined),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      countByRuleId: vi.fn().mockResolvedValue(1),
    });
    const useCase = new UpdateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(rule.id, { title: 'Updated Title' }, testCx);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.title).toBe('Updated Title');
    expect(result.data.code).toBe('DDD-001');
  });

  it('should update multiple fields and create revision with changedFields', async () => {
    const rule = createTestRule();
    const saveWithRevision = vi.fn().mockResolvedValue(undefined);
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
      saveWithRevision,
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      countByRuleId: vi.fn().mockResolvedValue(2),
    });
    const useCase = new UpdateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(
      rule.id,
      {
        title: 'New Title',
        description: 'This is a new description that is long enough to pass validation.',
      },
      testCx,
    );

    expect(result.ok).toBe(true);
    expect(saveWithRevision).toHaveBeenCalledTimes(1);
    // The second argument to saveWithRevision should be a RuleRevision
    const savedRevision = saveWithRevision.mock.calls[0][1];
    expect(savedRevision.changedFields).toContain('title');
    expect(savedRevision.changedFields).toContain('description');
    expect(savedRevision.revisionNumber).toBe(3);
  });

  it('should save without revision when no fields changed', async () => {
    const rule = createTestRule();
    const save = vi.fn().mockResolvedValue(undefined);
    const saveWithRevision = vi.fn();
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
      save,
      saveWithRevision,
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>();
    const useCase = new UpdateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(rule.id, {}, testCx);

    expect(result.ok).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(saveWithRevision).not.toHaveBeenCalled();
  });

  it('should return NOT_FOUND when rule does not exist', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(null),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>();
    const useCase = new UpdateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute('non-existent-id', { title: 'New' }, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('should return error when findById fails', async () => {
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockRejectedValue(new Error('Database failed')),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>();
    const useCase = new UpdateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute('some-id', { title: 'New' }, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });

  it('should return validation error for title too short', async () => {
    const rule = createTestRule();
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      countByRuleId: vi.fn().mockResolvedValue(1),
    });
    const useCase = new UpdateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(rule.id, { title: 'AB' }, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return error when saveWithRevision fails', async () => {
    const rule = createTestRule();
    const ruleRepo = createMockRepo<IRuleRepository>({
      findById: vi.fn().mockResolvedValue(rule),
      saveWithRevision: vi.fn().mockRejectedValue(new Error('Save failed')),
    });
    const revisionRepo = createMockRepo<IRuleRevisionRepository>({
      countByRuleId: vi.fn().mockResolvedValue(0),
    });
    const useCase = new UpdateRuleUseCase(ruleRepo, revisionRepo);

    const result = await useCase.execute(rule.id, { title: 'Updated' }, testCx);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INTERNAL_ERROR');
  });
});
