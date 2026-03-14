import { describe, expect, it } from 'vitest';
import type { RuleClientDTO } from '../../contracts/aggregates/rule-client';
import { Rule } from './rule';

function createRuleClientDTO(overrides: Partial<RuleClientDTO> = {}): RuleClientDTO {
  return {
    id: 'RuleId_00000000-0000-0000-0000-000000000001' as RuleClientDTO['id'],
    code: 'GOV-001',
    title: 'Use aggregate roots intentionally',
    description:
      'Aggregate roots should enforce invariants and expose intention-revealing methods.',
    severity: 'Mandatory',
    status: 'Active',
    deprecationReason: null,
    replacementRuleId: null,
    liveReferenceLocation: 'packages/governance/src/domain-server/aggregates/rule.ts',
    tags: [{ value: 'ddd' }, { value: 'aggregate-root' }],
    goodExamples: [
      {
        id: 'CodeSnippetId_00000000-0000-0000-0000-000000000001' as NonNullable<
          RuleClientDTO['goodExamples'][number]['id']
        >,
        type: 'GoodExample',
        language: 'TypeScript',
        content: 'class Order extends AggregateRoot<OrderId> {}',
        caption: 'Aggregate root example',
      },
    ],
    badExamples: [
      {
        id: 'CodeSnippetId_00000000-0000-0000-0000-000000000002' as NonNullable<
          RuleClientDTO['badExamples'][number]['id']
        >,
        type: 'BadExample',
        language: 'TypeScript',
        content: 'class Order { public status = "any" }',
        caption: 'Anemic model example',
      },
    ],
    authorId: 'user-1' as RuleClientDTO['authorId'],
    createdAt: 1741910400000,
    updatedAt: 1741914000000,
    ...overrides,
  };
}

describe('Rule.fromClientDTO', () => {
  it('hydrates a rich client entity from DTO', () => {
    const result = Rule.fromClientDTO(createRuleClientDTO());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.code).toBe('GOV-001');
    expect(result.data.hasTag('ddd')).toBe(true);
    expect(result.data.goodExamples).toHaveLength(1);
    expect(result.data.updatedAt).toBeInstanceOf(Date);
  });

  it('returns validation error when snippet data is invalid', () => {
    const result = Rule.fromClientDTO(
      createRuleClientDTO({
        goodExamples: [
          {
            id: 'CodeSnippetId_00000000-0000-0000-0000-000000000003' as NonNullable<
              RuleClientDTO['goodExamples'][number]['id']
            >,
            type: 'GoodExample',
            language: 'Rust' as unknown as RuleClientDTO['goodExamples'][number]['language'],
            content: 'fn main() {}',
            caption: null,
          },
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });
});
