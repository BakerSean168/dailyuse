/**
 * Instance generation policy for TaskTemplate.
 *
 * Pure functions that determine whether and how task instances should be generated.
 * Extracted from TaskTemplate aggregate to reduce aggregate size.
 */

import { DayOfWeek, RecurrenceFrequency } from '@memoflow/contracts/task';
import { createTimeFacade } from '@memoflow/time';

const taskTime = createTimeFacade();
import { TaskType } from '../value-objects';
import { TaskTemplateStatus } from '../../domain/value-objects/task-template-status';
import {
  InvalidDateRangeError,
  TaskTemplateArchivedError,
  InvalidTaskTemplateStateError,
} from '../value-objects/task-errors';
import type { RecurrenceRule, TaskTimeConfig } from '../value-objects';
import type { ImportanceLevel } from '@memoflow/contracts/shared';
import type { IdentityId } from '@memoflow/domain-shared';
import type { TaskTemplateId } from '../../domain/value-objects/task-template-id';
import { TaskInstance } from './task-instance';

/** Parameters for instance generation. */
export interface InstanceGenerationContext {
  templateId: TaskTemplateId;
  identityId: IdentityId;
  status: TaskTemplateStatus;
  taskType: TaskType;
  timeConfig: TaskTimeConfig | null;
  recurrenceRule: RecurrenceRule | null;
  importance: ImportanceLevel;
  existingInstances: { instanceDate: number; deletedAt: number | null }[];
}

/** Result of instance generation. */
export interface InstanceGenerationResult {
  instances: TaskInstance[];
  lastGeneratedDate: number | null;
}

/** Parameters for createInstance. */
export interface CreateInstanceParams {
  instanceDate: number;
}

export function startOfLocalDay(value: number): number {
  return taskTime.calendar.startOfDay(value);
}

/**
 * Validates and creates a single task instance from a template.
 */
export function createInstanceFromTemplate(
  ctx: InstanceGenerationContext,
  params: CreateInstanceParams,
): TaskInstance {
  if (ctx.status === TaskTemplateStatus.Archived) {
    throw new TaskTemplateArchivedError(ctx.templateId);
  }
  if (ctx.status === TaskTemplateStatus.Deleted) {
    throw new InvalidTaskTemplateStateError('Cannot create instance from deleted template', {
      templateId: ctx.templateId,
      currentStatus: ctx.status,
      attemptedAction: 'createInstance',
    });
  }
  if (typeof params.instanceDate !== 'number' || isNaN(params.instanceDate)) {
    throw new InvalidTaskTemplateStateError('instanceDate must be a valid number', {
      templateId: ctx.templateId,
      currentStatus: ctx.status,
      attemptedAction: 'createInstance',
    });
  }
  if (!ctx.timeConfig) {
    throw new InvalidTaskTemplateStateError('Template must have timeConfig to create instances', {
      templateId: ctx.templateId,
      currentStatus: ctx.status,
      attemptedAction: 'createInstance',
    });
  }

  return TaskInstance.create({
    templateId: ctx.templateId,
    identityId: ctx.identityId,
    instanceDate: params.instanceDate,
    timeConfig: ctx.timeConfig,
    importance: ctx.importance,
  });
}

/**
 * Generates task instances within the specified date range.
 */
export function generateInstances(
  ctx: InstanceGenerationContext,
  fromDate: number,
  toDate: number,
): InstanceGenerationResult {
  if (fromDate >= toDate) {
    throw new InvalidDateRangeError(fromDate, toDate);
  }
  if (ctx.status === TaskTemplateStatus.Archived) {
    throw new TaskTemplateArchivedError(ctx.templateId);
  }
  if (ctx.status !== TaskTemplateStatus.Active) {
    throw new InvalidTaskTemplateStateError('Can only generate instances for active templates', {
      templateId: ctx.templateId,
      currentStatus: ctx.status,
      attemptedAction: 'generateInstances',
    });
  }

  const instances: TaskInstance[] = [];

  if (ctx.taskType === TaskType.OneTime) {
    if (ctx.timeConfig?.startDate) {
      const targetDay = startOfLocalDay(ctx.timeConfig.startDate);
      const alreadyGenerated = ctx.existingInstances.some(
        (inst) => startOfLocalDay(inst.instanceDate) === targetDay,
      );

      if (!alreadyGenerated) {
        instances.push(
          TaskInstance.create({
            templateId: ctx.templateId,
            identityId: ctx.identityId,
            instanceDate: targetDay,
            timeConfig: ctx.timeConfig,
            importance: ctx.importance,
          }),
        );
      }
    }
  } else if (
    ctx.taskType === TaskType.Recurring &&
    ctx.recurrenceRule &&
    ctx.timeConfig
  ) {
    const fromDay = startOfLocalDay(fromDate);
    const endDate = startOfLocalDay(toDate);
    const maxOccurrences = ctx.recurrenceRule.occurrences;
    const existingInstanceCount = ctx.existingInstances.filter(
      (instance) => !instance.deletedAt,
    ).length;

    if (maxOccurrences !== null && existingInstanceCount >= maxOccurrences) {
      return { instances: [], lastGeneratedDate: null };
    }

    let currentDate = fromDay;

    while (
      currentDate <= endDate &&
      (maxOccurrences === null || existingInstanceCount + instances.length < maxOccurrences)
    ) {
      if (shouldGenerateInstance(ctx, currentDate)) {
        instances.push(
          TaskInstance.create({
            templateId: ctx.templateId,
            identityId: ctx.identityId,
            instanceDate: currentDate,
            timeConfig: ctx.timeConfig,
            importance: ctx.importance,
          }),
        );
      }
      currentDate = taskTime.calendar.addDays(currentDate, 1);
    }
  }

  const lastGeneratedDate = instances.length > 0 ? toDate : null;
  return { instances, lastGeneratedDate };
}

/**
 * Determines whether an instance should be generated for the given date.
 */
export function shouldGenerateInstance(
  ctx: InstanceGenerationContext,
  date: number,
): boolean {
  if (ctx.status !== TaskTemplateStatus.Active) {
    return false;
  }
  if (ctx.taskType === TaskType.OneTime) {
    return false;
  }
  if (!ctx.recurrenceRule) {
    return false;
  }

  const candidateDay = startOfLocalDay(date);
  const alreadyGenerated = ctx.existingInstances.some(
    (instance) =>
      !instance.deletedAt && startOfLocalDay(instance.instanceDate) === candidateDay,
  );
  if (alreadyGenerated) {
    return false;
  }

  if (ctx.timeConfig?.startDate) {
    const templateStartDay = startOfLocalDay(ctx.timeConfig.startDate);
    if (candidateDay < templateStartDay) {
      return false;
    }
  }

  if (
    ctx.recurrenceRule.endDate &&
    candidateDay > startOfLocalDay(ctx.recurrenceRule.endDate)
  ) {
    return false;
  }

  if (
    ctx.recurrenceRule.occurrences !== null &&
    ctx.existingInstances.filter((instance) => !instance.deletedAt).length >=
      ctx.recurrenceRule.occurrences
  ) {
    return false;
  }

  const rule = ctx.recurrenceRule;
  const dateObj = new Date(candidateDay);

  switch (rule.frequency) {
    case RecurrenceFrequency.Daily:
      if (!ctx.timeConfig?.startDate) {
        return true;
      }
      return (
        taskTime.calendar.diffCalendarDays(dateObj.getTime(), ctx.timeConfig.startDate) %
          rule.interval ===
        0
      );

    case RecurrenceFrequency.Weekly:
      if (!ctx.timeConfig?.startDate) {
        return false;
      }
      if (
        taskTime.calendar.diffCalendarWeeks(
          dateObj.getTime(),
          ctx.timeConfig.startDate,
        ) %
          rule.interval !==
        0
      ) {
        return false;
      }
      return rule.daysOfWeek.includes(dateObj.getDay() as DayOfWeek);

    case RecurrenceFrequency.Monthly:
      return true;

    case RecurrenceFrequency.Yearly:
      return true;

    default:
      return false;
  }
}

/**
 * Checks whether the template is active on a given date.
 */
export function isActiveOnDate(
  ctx: InstanceGenerationContext,
  date: number,
): boolean {
  if (ctx.status !== TaskTemplateStatus.Active) {
    return false;
  }
  if (ctx.taskType === TaskType.OneTime) {
    return ctx.timeConfig?.startDate === date;
  }
  if (!ctx.recurrenceRule) {
    return false;
  }
  if (ctx.recurrenceRule.endDate && date > ctx.recurrenceRule.endDate) {
    return false;
  }
  return true;
}

/**
 * Gets the next occurrence date after the given date.
 */
export function getNextOccurrence(
  ctx: InstanceGenerationContext,
  afterDate: number,
): number | null {
  if (ctx.status !== TaskTemplateStatus.Active) {
    return null;
  }
  if (ctx.taskType === TaskType.OneTime) {
    if (ctx.timeConfig?.startDate && ctx.timeConfig.startDate > afterDate) {
      return ctx.timeConfig.startDate;
    }
    return null;
  }
  if (!ctx.recurrenceRule) {
    return null;
  }
  const ONE_DAY_MS = 86400000;
  return afterDate + ONE_DAY_MS;
}
