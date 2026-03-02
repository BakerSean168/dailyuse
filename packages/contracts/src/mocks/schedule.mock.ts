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
import type { ScheduleTaskClientDTO, ScheduleExecutionClientDTO } from '../modules/schedule';
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
    sourceModule: faker.helpers.arrayElement(['reminder', 'task', 'goal']),
    sourceEntityId: faker.string.uuid(),
    status: faker.helpers.arrayElement(['Active', 'Paused', 'Completed', 'Cancelled', 'Failed']),
    enabled: faker.datatype.boolean(),
    schedule: {
      type: faker.helpers.arrayElement(['Cron', 'Interval', 'Once']),
      cronExpression: faker.datatype.boolean() ? '0 9 * * *' : null,
      intervalMinutes: faker.datatype.boolean() ? faker.number.int({ min: 5, max: 1440 }) : null,
      nextRunAt: now + faker.number.int({ min: 60000, max: 86400000 }),
      lastRunAt: faker.datatype.boolean()
        ? now - faker.number.int({ min: 60000, max: 86400000 })
        : null,
    },
    execution: {
      totalRuns: faker.number.int({ min: 0, max: 100 }),
      successfulRuns: faker.number.int({ min: 0, max: 50 }),
      failedRuns: faker.number.int({ min: 0, max: 10 }),
      lastSuccessAt: faker.datatype.boolean()
        ? now - faker.number.int({ min: 0, max: 86400000 })
        : null,
      lastFailureAt: faker.datatype.boolean()
        ? now - faker.number.int({ min: 0, max: 86400000 })
        : null,
    },
    retryPolicy: {
      maxRetries: faker.number.int({ min: 0, max: 5 }),
      retryDelayMs: faker.helpers.arrayElement([1000, 5000, 10000, 30000]),
      backoffMultiplier: faker.number.float({ min: 1, max: 3, fractionDigits: 1 }),
    },
    metadata: {
      createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
      updatedAt: now,
      tags: faker.helpers.arrayElements(
        ['important', 'routine', 'cleanup', 'sync'],
        faker.number.int({ min: 0, max: 2 }),
      ),
    },
    version: 1,
    createdAt: now - faker.number.int({ min: 0, max: 30 * 24 * 60 * 60 * 1000 }),
    updatedAt: now,
    deletedAt: null,
    statusDisplay: faker.helpers.arrayElement(['活跃', '暂停', '完成', '取消', '失败']),
    statusColor: faker.helpers.arrayElement(['green', 'gray', 'blue', 'red', 'orange']),
    sourceModuleDisplay: faker.helpers.arrayElement(['提醒模块', '任务模块', '目标模块']),
    enabledDisplay: faker.datatype.boolean() ? '启用' : '禁用',
    nextRunAtFormatted: faker.date.future().toISOString(),
    lastRunAtFormatted: faker.datatype.boolean() ? faker.date.recent().toISOString() : '从未执行',
    executionSummary: `已执行 ${faker.number.int({ min: 0, max: 50 })} 次，成功 ${faker.number.int({ min: 0, max: 40 })} 次`,
    healthStatus: faker.helpers.arrayElement(['healthy', 'warning', 'critical']),
    isOverdue: faker.datatype.boolean(),
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
  const status = faker.helpers.arrayElement(['Success', 'Failed', 'Timeout', 'Skipped', 'Retry']);

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
    executionTimeFormatted: faker.date.recent().toISOString(),
    statusDisplay: faker.helpers.arrayElement(['成功', '失败', '超时', '跳过', '重试中']),
    statusColor: faker.helpers.arrayElement(['green', 'red', 'orange', 'gray', 'yellow']),
    durationFormatted: `${faker.number.int({ min: 100, max: 5000 })}ms`,
    hasError: status === 'Failed',
    hasResult: faker.datatype.boolean(),
    resultSummary: faker.datatype.boolean() ? '执行成功' : '无结果',
    ...overrides,
  } as ScheduleExecutionClientDTO;
}

export function createMockScheduleExecutionList(
  count = 5,
  overrides: Partial<ScheduleExecutionClientDTO> = {},
): ScheduleExecutionClientDTO[] {
  return Array.from({ length: count }, () => createMockScheduleExecution(overrides));
}
