/**
 * Schedule Module - Mock Generators
 *
 * Provides factory functions for generating realistic mock data
 * that conforms to the Schedule module contracts.
 *
 * Usage:
 * ```ts
 * import { createMockScheduleTask, createMockScheduleExecution } from '@dailyuse/contracts/mocks';
 * const task = createMockScheduleTask();
 * const execution = createMockScheduleExecution();
 * ```
 */

import { faker } from '@faker-js/faker';
import type { ScheduleTaskClientDTO } from '../modules/schedule/aggregates/schedule-task-client';
import type { ScheduleExecutionClientDTO } from '../modules/schedule/entities/schedule-execution-client';
import type { ScheduleTaskId, IdentityId } from '../primitives/ids';

export function createMockScheduleTask(
  overrides: Partial<ScheduleTaskClientDTO> = {},
): ScheduleTaskClientDTO {
  const now = Date.now();
  const id = faker.string.uuid();

  return {
    id: id as ScheduleTaskId,
    identityId: faker.string.uuid() as IdentityId,
    name: faker.lorem.words({ min: 2, max: 4 }),
    description: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    sourceModule: faker.helpers.arrayElement(['Reminder', 'Task', 'Goal', 'Notification', 'System', 'Custom']),
    sourceEntityId: faker.string.uuid(),
    status: faker.helpers.arrayElement(['Active', 'Paused', 'Completed', 'Cancelled', 'Failed']),
    enabled: faker.datatype.boolean(),
    schedule: {
      cronExpression: faker.datatype.boolean() ? '0 9 * * *' : null,
      timezone: 'UTC',
      startDate: faker.datatype.boolean()
        ? new Date(now - faker.number.int({ min: 86400000, max: 30 * 86400000 })).toISOString()
        : null,
      endDate: faker.datatype.boolean()
        ? new Date(now + faker.number.int({ min: 86400000, max: 90 * 86400000 })).toISOString()
        : null,
      maxExecutions: faker.datatype.boolean() ? faker.number.int({ min: 10, max: 1000 }) : null,
    },
    execution: {
      nextRunAt: faker.datatype.boolean()
        ? new Date(now + faker.number.int({ min: 60000, max: 86400000 })).toISOString()
        : null,
      lastRunAt: faker.datatype.boolean()
        ? new Date(now - faker.number.int({ min: 60000, max: 86400000 })).toISOString()
        : null,
      executionCount: faker.number.int({ min: 0, max: 100 }),
      lastExecutionStatus: faker.helpers.arrayElement([
        'Success', 'Failed', 'Timeout', 'Skipped', 'Retrying', null,
      ]),
      lastExecutionDuration: faker.datatype.boolean()
        ? faker.number.int({ min: 100, max: 30000 })
        : null,
      consecutiveFailures: faker.number.int({ min: 0, max: 5 }),
    },
    retryPolicy: {
      enabled: faker.datatype.boolean(),
      maxRetries: faker.number.int({ min: 0, max: 5 }),
      retryDelay: faker.helpers.arrayElement([1000, 5000, 10000, 30000]),
      backoffMultiplier: faker.number.float({ min: 1, max: 3, fractionDigits: 1 }),
      maxRetryDelay: faker.helpers.arrayElement([60000, 300000, 600000]),
    },
    metadata: {
      payload: {},
      tags: faker.helpers.arrayElements(
        ['important', 'routine', 'cleanup', 'sync'],
        faker.number.int({ min: 0, max: 2 }),
      ),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
      timeout: faker.datatype.boolean() ? faker.number.int({ min: 5000, max: 120000 }) : null,
    },
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    executions: null,
    ...overrides,
  } as ScheduleTaskClientDTO;
}

export function createMockScheduleTaskList(
  count = 5,
  overrides: Partial<ScheduleTaskClientDTO> = {},
): ScheduleTaskClientDTO[] {
  return Array.from({ length: count }, () => createMockScheduleTask(overrides));
}

export function createMockScheduleExecution(
  overrides: Partial<ScheduleExecutionClientDTO> = {},
): ScheduleExecutionClientDTO {
  const now = Date.now();
  const id = faker.string.uuid();
  const status = faker.helpers.arrayElement(['Success', 'Failed', 'Timeout', 'Skipped', 'Retrying']);

  return {
    id,
    scheduleTaskId: faker.string.uuid(),
    executionTime: now - faker.number.int({ min: 0, max: 86400000 }),
    status,
    duration: faker.number.int({ min: 100, max: 30000 }),
    result: faker.datatype.boolean() ? { message: 'Execution completed', data: {} } : null,
    error: status === 'Failed' ? faker.lorem.sentence() : null,
    retryCount: faker.number.int({ min: 0, max: 3 }),
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 86400000 }),
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  } as ScheduleExecutionClientDTO;
}

export function createMockScheduleExecutionList(
  count = 5,
  overrides: Partial<ScheduleExecutionClientDTO> = {},
): ScheduleExecutionClientDTO[] {
  return Array.from({ length: count }, () => createMockScheduleExecution(overrides));
}
