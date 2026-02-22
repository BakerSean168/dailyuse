/**
 * Governance Module - Mock Generators
 *
 * Provides factory functions for generating realistic mock data
 * that conforms to the Governance module contracts.
 *
 * Usage:
 * ```ts
 * import { createMockRule } from '@dailyuse/contracts/mocks';
 * const rule = createMockRule();
 * ```
 */

import { faker } from '@faker-js/faker';

export interface RuleClientDTO {
  id: string;
  code: string;
  title: string;
  description: string | null;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  status: 'Active' | 'Deprecated' | 'Draft' | 'Archived';
  tags: string[];
  goodExamples: Array<{ language: string; code: string; description: string }>;
  badExamples: Array<{ language: string; code: string; description: string }>;
  authorId: string;
  deprecationReason: string | null;
  replacementRuleId: string | null;
  liveReferenceLocation: string | null;
  version: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface RuleRevisionClientDTO {
  id: string;
  ruleId: string;
  version: number;
  changes: string;
  authorId: string;
  createdAt: number;
}

export function createMockRule(overrides: Partial<RuleClientDTO> = {}): RuleClientDTO {
  const now = Date.now();
  const id = faker.string.uuid();
  const status = faker.helpers.arrayElement(['Active', 'Deprecated', 'Draft', 'Archived']);

  return {
    id,
    code: `RULE-${faker.number.int({ min: 100, max: 999 })}`,
    title: faker.lorem.words({ min: 3, max: 8 }),
    description: faker.datatype.boolean() ? faker.lorem.paragraph({ min: 1, max: 3 }) : null,
    severity: faker.helpers.arrayElement(['Critical', 'High', 'Medium', 'Low', 'Info']),
    status,
    tags: faker.helpers.arrayElements(
      ['typescript', 'security', 'performance', 'style', 'testing'],
      faker.number.int({ min: 1, max: 3 }),
    ),
    goodExamples: [
      {
        language: 'typescript',
        code: `// Good example\nconst value = await fetch('${faker.internet.url()}');`,
        description: faker.lorem.sentence(),
      },
    ],
    badExamples: [
      {
        language: 'typescript',
        code: `// Bad example\nconst value = fetch('${faker.internet.url()}'); // missing await`,
        description: faker.lorem.sentence(),
      },
    ],
    authorId: faker.string.uuid(),
    deprecationReason: status === 'Deprecated' ? faker.lorem.sentence() : null,
    replacementRuleId: status === 'Deprecated' ? faker.string.uuid() : null,
    liveReferenceLocation: faker.datatype.boolean()
      ? `src/${faker.system.commonFileName('ts')}`
      : null,
    version: faker.number.int({ min: 1, max: 10 }),
    createdAt: now - faker.number.int({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
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

  return {
    id: faker.string.uuid(),
    ruleId: faker.string.uuid(),
    version: faker.number.int({ min: 1, max: 10 }),
    changes: faker.lorem.paragraph({ min: 1, max: 2 }),
    authorId: faker.string.uuid(),
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
      version: index + 1,
      ...overrides,
    }),
  );
}
