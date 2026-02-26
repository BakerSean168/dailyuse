/**
 * Goal Module - Mock Generators
 *
 * Provides factory functions for generating realistic mock data
 * that conforms to the Goal module contracts.
 *
 * Usage:
 * ```ts
 * import { createMockGoal, createMockGoalList } from '@dailyuse/contracts/mocks';
 * const goal = createMockGoal({ name: 'Custom Goal' });
 * const goals = createMockGoalList(5);
 * ```
 */

import { faker } from '@faker-js/faker';
import type {
  GoalClientDTO,
  GoalFolderClientDTO,
  KeyResultClientDTO,
  QueryGoalsRes,
} from '../modules/goal';

// ============================================================================
// GoalClientDTO
// ============================================================================

/**
 * Creates a single mock GoalClientDTO.
 * Pass overrides to customise specific fields.
 */
export function createMockGoal(overrides: Partial<GoalClientDTO> = {}): GoalClientDTO {
  const now = Date.now();
  const id = `IGoalId_${faker.string.uuid()}` as GoalClientDTO['id'];
  const identityId = `IdentityId_${faker.string.uuid()}` as GoalClientDTO['identityId'];

  return {
    id,
    identityId,
    name: faker.lorem.words({ min: 2, max: 5 }),
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    color: faker.datatype.boolean() ? faker.color.rgb({ format: 'hex', casing: 'upper' }) : null,
    feasibilityAnalysis: null,
    motivation: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    status: faker.helpers.arrayElement(['Active', 'Completed', 'Archived'] as const),
    importance: faker.helpers.arrayElement([
      'Vital',
      'Important',
      'Moderate',
      'Minor',
      'Trivial',
    ] as const),
    priority: faker.number.int({ min: 0, max: 10000 }),
    category: faker.datatype.boolean() ? faker.word.noun() : null,
    tags: faker.helpers.arrayElements(
      ['work', 'personal', 'health', 'learning', 'finance'],
      faker.number.int({ min: 0, max: 3 }),
    ),
    startDate: faker.datatype.boolean() ? faker.date.past({ years: 1 }).getTime() : null,
    targetDate: faker.datatype.boolean() ? faker.date.future({ years: 1 }).getTime() : null,
    completedAt: null,
    archivedAt: null,
    folderId: null,
    parentGoalId: null,
    sortOrder: faker.number.int({ min: 0, max: 1000 }),
    reminderConfig: null,
    createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    version: 1,
    keyResults: null,
    reviews: null,
    ...overrides,
  };
}

/**
 * Creates an array of mock GoalClientDTO objects.
 */
export function createMockGoalList(
  count = 5,
  overrides: Partial<GoalClientDTO> = {},
): GoalClientDTO[] {
  return Array.from({ length: count }, () => createMockGoal(overrides));
}

/**
 * Creates a paginated mock response for the goals list endpoint.
 */
export function createMockQueryGoalsRes(count = 5, total?: number): QueryGoalsRes {
  const goals = createMockGoalList(count);
  const totalCount = total ?? count;

  return {
    data: goals,
    pagination: {
      page: 1,
      pageSize: 20,
      total: totalCount,
      hasMore: totalCount > count,
      totalPages: Math.ceil(totalCount / 20),
    },
  };
}

// ============================================================================
// GoalFolderClientDTO
// ============================================================================

export function createMockGoalFolder(
  overrides: Partial<GoalFolderClientDTO> = {},
): GoalFolderClientDTO {
  const now = Date.now();

  return {
    id: `IGoalFolderId_${faker.string.uuid()}` as GoalFolderClientDTO['id'],
    identityId: `IdentityId_${faker.string.uuid()}` as GoalFolderClientDTO['identityId'],
    name: faker.word.noun(),
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    color: faker.color.rgb({ format: 'hex', casing: 'upper' }),
    icon: null,
    parentId: null,
    sortOrder: faker.number.int({ min: 0, max: 100 }),
    goalCount: faker.number.int({ min: 0, max: 20 }),
    createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    version: 1,
    ...overrides,
  } as GoalFolderClientDTO;
}

// ============================================================================
// KeyResultClientDTO
// ============================================================================

export function createMockKeyResult(
  overrides: Partial<KeyResultClientDTO> = {},
): KeyResultClientDTO {
  const now = Date.now();

  return {
    id: `IKeyResultId_${faker.string.uuid()}`,
    title: faker.lorem.words({ min: 3, max: 6 }),
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    progress: {
      valueType: 'Incremental',
      aggregationMethod: 'Sum',
      initialValue: 0,
      targetValue: faker.number.int({ min: 10, max: 100 }),
      currentValue: faker.number.int({ min: 0, max: 100 }),
      unit: null,
    },
    weight: faker.number.int({ min: 1, max: 100 }),
    order: faker.number.int({ min: 0, max: 100 }),
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}
