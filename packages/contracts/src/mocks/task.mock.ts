/**
 * Task Module - Mock Generators
 *
 * Provides factory functions for generating realistic mock data
 * that conforms to the Task module contracts.
 *
 * Usage:
 * ```ts
 * import { createMockTaskTemplate } from '@memoflow/contracts/mocks';
 * const task = createMockTaskTemplate();
 * ```
 */

import { faker } from '@faker-js/faker';
import type { TaskTemplateClientDTO } from '../modules/task/aggregates/task-template-client';
import type { TaskInstanceClientDTO } from '../modules/task/aggregates/task-instance-client';
import type { TaskTemplateId, TaskInstanceId, IdentityId } from '../primitives';

// ============================================================================
// TaskTemplateClientDTO
// ============================================================================

/**
 * Creates a single mock TaskTemplateClientDTO.
 * Pass overrides to customise specific fields.
 */
export function createMockTaskTemplate(
  overrides: Partial<TaskTemplateClientDTO> = {},
): TaskTemplateClientDTO {
  const now = Date.now();
  const startDate = faker.date.recent({ days: 30 }).getTime();

  return {
    id: faker.string.uuid() as TaskTemplateId,
    identityId: faker.string.uuid() as IdentityId,
    name: faker.lorem.words({ min: 2, max: 5 }),
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    timeConfig: {
      timeType: 'AllDay',
      startDate,
      timePoint: null,
      timeRange: null,
    },
    recurrenceRule: null,
    reminderConfig: null,
    importance: faker.helpers.arrayElement([
      'Vital',
      'Important',
      'Moderate',
      'Minor',
      'Trivial',
    ] as const),
    priority: faker.number.int({ min: 0, max: 10000 }),
    goalBinding: null,
    folderId: null,
    tags: faker.helpers.arrayElements(
      ['work', 'personal', 'health', 'learning'],
      faker.number.int({ min: 0, max: 2 }),
    ),
    color: faker.datatype.boolean() ? faker.color.rgb({ format: 'hex', casing: 'upper' }) : null,
    status: faker.helpers.arrayElement(['Active', 'Paused', 'Completed', 'Deleted'] as const),
    lastGeneratedDate: null,
    generateAheadDays: null,
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    history: [],
    instances: [],
    parentTaskId: null,
    startDate: startDate,
    dueDate: faker.datatype.boolean() ? faker.date.soon({ days: 14 }).getTime() : null,
    completedAt: null,
    estimatedMinutes: faker.datatype.boolean()
      ? faker.helpers.arrayElement([15, 30, 45, 60, 90, 120])
      : null,
    actualMinutes: null,
    comment: null,
    blockingReason: null,
    instanceCount: faker.number.int({ min: 0, max: 10 }),
    completedInstanceCount: faker.number.int({ min: 0, max: 5 }),
    pendingInstanceCount: faker.number.int({ min: 0, max: 5 }),
    completionRate: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
    dueInstanceCount: 0,
    completedDueInstanceCount: 0,
    completionWindowDays: 30,
    futurePendingInstanceCount: 0,
    singleInstanceStatus: null,
    ...overrides,
  } as TaskTemplateClientDTO;
}

/**
 * Creates an array of mock TaskTemplateClientDTO objects.
 */
export function createMockTaskTemplateList(
  count = 5,
  overrides: Partial<TaskTemplateClientDTO> = {},
): TaskTemplateClientDTO[] {
  return Array.from({ length: count }, () => createMockTaskTemplate(overrides));
}

// ============================================================================
// TaskInstanceClientDTO
// ============================================================================

/**
 * Creates a single mock TaskInstanceClientDTO.
 * Pass overrides to customise specific fields.
 */
export function createMockTaskInstance(
  overrides: Partial<TaskInstanceClientDTO> = {},
): TaskInstanceClientDTO {
  const now = Date.now();
  const instanceDate = faker.date.soon({ days: 7 }).getTime();

  return {
    id: faker.string.uuid() as TaskInstanceId,
    templateId: faker.string.uuid() as TaskTemplateId,
    identityId: faker.string.uuid() as IdentityId,
    instanceDate,
    timeConfig: {
      timeType: 'AllDay',
      startDate: instanceDate,
      timePoint: null,
      timeRange: null,
    },
    importance: faker.helpers.arrayElement([
      'Vital',
      'Important',
      'Moderate',
      'Minor',
      'Trivial',
    ] as const),
    priority: faker.number.int({ min: 0, max: 10000 }),
    status: faker.helpers.arrayElement(['Pending', 'InProgress', 'Completed', 'Skipped'] as const),
    actualStartTime: null,
    actualEndTime: null,
    comment: null,
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 7 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as TaskInstanceClientDTO;
}

/**
 * Creates an array of mock TaskInstanceClientDTO objects.
 */
export function createMockTaskInstanceList(
  count = 5,
  overrides: Partial<TaskInstanceClientDTO> = {},
): TaskInstanceClientDTO[] {
  return Array.from({ length: count }, () => createMockTaskInstance(overrides));
}
