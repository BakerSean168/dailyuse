import { describe, expect, it } from 'vitest';
import {
  CreateTaskTemplateSchema,
  TaskTimeConfigSchema,
  UpdateTaskTemplateSchema,
} from './task-template.dto';
import {
  CreateTaskTemplateResponseSchema,
  TaskTemplateResponseSchema,
} from './response-schemas';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import { TaskTemplateStatus } from '../value-objects/task-template-status';
import { TaskTimeType } from '../value-objects/task-time-type';
import { TaskType } from '../value-objects/task-type';

const uuid = '550e8400-e29b-41d4-a716-446655440000';

function validTimeConfig() {
  return {
    timeType: TaskTimeType.AllDay,
    startDate: null,
    timePoint: null,
    timeRange: null,
  };
}

function validCreatePayload() {
  return {
    name: 'Review plan',
    description: null,
    taskType: TaskType.OneTime,
    timeConfig: validTimeConfig(),
    recurrenceRule: null,
    reminderConfig: null,
    importance: ImportanceLevel.Moderate,
    parentTaskId: null,
    folderId: null,
    tags: ['planning'],
    color: null,
    goalBinding: null,
  };
}

function validTemplateResponse() {
  return {
    id: `ITaskTemplateId_${uuid}`,
    identityId: `IdentityId_${uuid}`,
    name: 'Review plan',
    description: null,
    timeConfig: validTimeConfig(),
    recurrenceRule: null,
    reminderConfig: null,
    importance: ImportanceLevel.Moderate,
    priority: 3,
    goalBinding: null,
    folderId: null,
    tags: ['planning'],
    color: null,
    status: TaskTemplateStatus.Active,
    lastGeneratedDate: null,
    generateAheadDays: null,
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    parentTaskId: null,
    startDate: null,
    dueDate: null,
    completedAt: null,
    estimatedMinutes: null,
    actualMinutes: null,
    comment: null,
    dependencyStatus: 'None',
    isBlocked: false,
    blockingReason: null,
    instanceCount: 0,
    completedInstanceCount: 0,
    pendingInstanceCount: 0,
    completionRate: 0,
  };
}

describe('task template contracts', () => {
  it('accepts a valid create payload', () => {
    expect(CreateTaskTemplateSchema.safeParse(validCreatePayload()).success).toBe(true);
  });

  it('rejects unknown create and update properties', () => {
    expect(
      CreateTaskTemplateSchema.safeParse({
        ...validCreatePayload(),
        unexpected: true,
      }).success,
    ).toBe(false);

    expect(
      UpdateTaskTemplateSchema.safeParse({
        name: 'Updated',
        unexpected: true,
      }).success,
    ).toBe(false);
  });

  it('rejects invalid task response enum fields', () => {
    expect(TaskTemplateResponseSchema.safeParse(validTemplateResponse()).success).toBe(true);

    expect(
      TaskTemplateResponseSchema.safeParse({
        ...validTemplateResponse(),
        importance: 'VeryImportant',
      }).success,
    ).toBe(false);

    expect(
      TaskTemplateResponseSchema.safeParse({
        ...validTemplateResponse(),
        status: 'Done',
      }).success,
    ).toBe(false);
  });

  it('preserves template creation instance feedback', () => {
    const parsed = CreateTaskTemplateResponseSchema.parse({
      template: validTemplateResponse(),
      instanceCount: 7,
      todayInstanceCreated: true,
    });

    expect(parsed.instanceCount).toBe(7);
    expect(parsed.todayInstanceCreated).toBe(true);
  });

  it('keeps time config validation intact', () => {
    expect(
      TaskTimeConfigSchema.safeParse({
        timeType: TaskTimeType.TimeRange,
        startDate: null,
        timePoint: null,
        timeRange: { start: 10, end: 5 },
      }).success,
    ).toBe(false);
  });
});
