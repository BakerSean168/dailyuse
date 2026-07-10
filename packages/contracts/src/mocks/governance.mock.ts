/**
 * Governance contract mock generators.
 * Governance 契约 mock 生成器。
 */

import { faker } from '@faker-js/faker';
import type {
  CodeSnippetId,
  IdentityId,
  RuleId,
  RuleRevisionId,
} from '../primitives';
import type {
  CodeSnippetDTO,
  RuleClientDTO,
  RuleRevisionClientDTO,
  RuleTagDTO,
} from '../modules/governance';

function createMockRuleTag(value?: string): RuleTagDTO {
  return {
    value:
      value ??
      faker.helpers.arrayElement(['typescript', 'security', 'performance', 'style', 'testing']),
  };
}

function createMockCodeSnippet(type: 'GoodExample' | 'BadExample'): CodeSnippetDTO {
  return {
    id: faker.string.uuid() as CodeSnippetId,
    language: 'TypeScript',
    content:
      type === 'GoodExample'
        ? `const value = await fetch('${faker.internet.url()}');`
        : `const value = fetch('${faker.internet.url()}');`,
    type,
    caption: faker.datatype.boolean() ? faker.lorem.sentence() : null,
  };
}

export function createMockRule(overrides: Partial<RuleClientDTO> = {}): RuleClientDTO {
  const now = Date.now();
  const status = faker.helpers.arrayElement(['Draft', 'Active', 'Deprecated'] as const);

  return {
    id: faker.string.uuid() as RuleId,
    code: `RULE-${faker.number.int({ min: 100, max: 999 })}`,
    title: faker.lorem.words({ min: 3, max: 8 }),
    description: faker.lorem.paragraph({ min: 1, max: 3 }),
    severity: faker.helpers.arrayElement(['Mandatory', 'Recommended'] as const),
    status,
    deprecationReason: status === 'Deprecated' ? faker.lorem.sentence() : null,
    replacementRuleId: status === 'Deprecated' ? (faker.string.uuid() as RuleId) : null,
    liveReferenceLocation: faker.datatype.boolean()
      ? `src/${faker.system.commonFileName('ts')}`
      : null,
    tags: faker.helpers
      .arrayElements(
        ['typescript', 'security', 'performance', 'style', 'testing'],
        faker.number.int({ min: 1, max: 3 }),
      )
      .map((tag) => createMockRuleTag(tag)),
    goodExamples: [createMockCodeSnippet('GoodExample')],
    badExamples: [createMockCodeSnippet('BadExample')],
    authorId: faker.string.uuid() as IdentityId,
    createdAt: now - faker.number.int({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    ...overrides,
  };
}

export function createMockRuleList(
  count = 5,
  overrides: Partial<RuleClientDTO> = {},
): RuleClientDTO[] {
  return Array.from({ length: count }, () => createMockRule(overrides));
}

export function createMockRuleRevision(
  overrides: Partial<RuleRevisionClientDTO> = {},
): RuleRevisionClientDTO {
  const now = Date.now();
  const changedFields = faker.helpers.arrayElements(
    ['title', 'description', 'severity', 'status', 'tags'],
    faker.number.int({ min: 1, max: 3 }),
  );
  const previousValues = Object.fromEntries(
    changedFields.map((field) => [field, faker.lorem.word()]),
  );
  const newValues = Object.fromEntries(changedFields.map((field) => [field, faker.lorem.word()]));

  return {
    id: faker.string.uuid() as RuleRevisionId,
    ruleId: faker.string.uuid() as RuleId,
    revisionNumber: faker.number.int({ min: 1, max: 10 }),
    authorId: faker.string.uuid() as IdentityId,
    changedFields,
    previousValues,
    newValues,
    changeType: faker.helpers.arrayElement(
      ['Created', 'Updated', 'Deprecated', 'Reactivated'] as const,
    ),
    createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    ...overrides,
  };
}

export function createMockRuleRevisionList(
  count = 3,
  overrides: Partial<RuleRevisionClientDTO> = {},
): RuleRevisionClientDTO[] {
  return Array.from({ length: count }, (_, index) =>
    createMockRuleRevision({
      revisionNumber: index + 1,
      ...overrides,
    }),
  );
}
