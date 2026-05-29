/**
 * DTO conversion helpers for TaskTemplate.
 *
 * Pure functions that convert internal aggregate state to DTOs.
 * Extracted from TaskTemplate aggregate to reduce aggregate size.
 */

import type {
  TaskTemplateServerDTO,
  TaskTemplateClientDTO,
} from '@dailyuse/contracts/task';
import { TaskTimeType as TimeType, TaskInstanceStatus } from '../../domain-shared/value-objects';
import { TaskType } from '../value-objects';
import type { PriorityLevel } from '@dailyuse/contracts/shared';
import type { TaskTemplateState } from './task-template';
import type { TaskInstance } from './task-instance';
import type { TaskTemplateHistory } from '../entities';

/** Context for DTO conversion — provides access to live aggregate state. */
export interface DtoConversionContext {
  readonly id: import('../../domain-shared/value-objects/task-template-id').TaskTemplateId;
  readonly props: Omit<TaskTemplateState, 'id'>;
  readonly instances: TaskInstance[];
  readonly history: TaskTemplateHistory[];
  getPriority(): { level: PriorityLevel; score: number };
}

/** Converts aggregate state to a server DTO. */
export function toServerDTO(ctx: DtoConversionContext, includeChildren: boolean): TaskTemplateServerDTO {
  return {
    id: ctx.id,
    identityId: ctx.props.identityId,
    name: ctx.props.title,
    description: ctx.props.description,
    timeConfig: ctx.props.timeConfig?.toDTO() ?? null,
    recurrenceRule: ctx.props.recurrenceRule?.toDTO() ?? null,
    reminderConfig: ctx.props.reminderConfig?.toDTO() ?? null,
    importance: ctx.props.importance,
    priority: ctx.props.taskType === TaskType.OneTime ? ctx.getPriority().score : undefined,
    goalBinding: ctx.props.goalBinding?.toDTO() ?? null,
    checklist: ctx.props.checklist.map((c) => c.toDTO()),
    folderId: ctx.props.folderId,
    tags: [...ctx.props.tags],
    color: ctx.props.color,
    status: ctx.props.status,
    lastGeneratedDate: ctx.props.lastGeneratedDate?.getTime() ?? null,
    generateAheadDays: ctx.props.generateAheadDays,
    parentTaskId: ctx.props.parentTaskId,
    dependencyStatus: ctx.props.dependencyStatus,
    isBlocked: ctx.props.isBlocked,
    blockingReason: ctx.props.blockingReason,
    createdAt: ctx.props.createdAt.getTime(),
    updatedAt: ctx.props.updatedAt.getTime(),
    deletedAt: ctx.props.deletedAt?.getTime() ?? null,
    version: ctx.props.version,
    instances: includeChildren ? ctx.instances.map((i) => i.toServerDTO()) : undefined,
  };
}

/** Converts aggregate state to a client DTO. */
export function toClientDTO(ctx: DtoConversionContext, includeChildren: boolean): TaskTemplateClientDTO {
  const completedCount = ctx.instances.filter(
    (i) => i.status === TaskInstanceStatus.Completed,
  ).length;
  const pendingCount = ctx.instances.filter(
    (i) => i.status === TaskInstanceStatus.Pending,
  ).length;
  const totalCount = ctx.instances.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const priority = ctx.props.taskType === TaskType.OneTime ? ctx.getPriority() : undefined;

  return {
    id: ctx.id,
    identityId: ctx.props.identityId,
    name: ctx.props.title,
    description: ctx.props.description,
    timeConfig: ctx.props.timeConfig?.toDTO() ?? {
      timeType: TimeType.AllDay,
      startDate: null,
      timePoint: null,
      timeRange: null,
    },
    recurrenceRule: ctx.props.recurrenceRule?.toDTO() ?? null,
    reminderConfig: ctx.props.reminderConfig?.toDTO() ?? null,
    importance: ctx.props.importance,
    priority: priority?.score,
    goalBinding: ctx.props.goalBinding?.toDTO() ?? null,
    folderId: ctx.props.folderId,
    tags: [...ctx.props.tags],
    color: ctx.props.color,
    status: ctx.props.status,
    lastGeneratedDate: ctx.props.lastGeneratedDate?.getTime() ?? null,
    generateAheadDays: ctx.props.generateAheadDays,
    createdAt: ctx.props.createdAt.getTime(),
    updatedAt: ctx.props.updatedAt.getTime(),
    deletedAt: ctx.props.deletedAt?.getTime() ?? null,
    version: ctx.props.version,
    parentTaskId: ctx.props.parentTaskId,
    startDate: ctx.props.startDate?.getTime() ?? null,
    dueDate: ctx.props.dueDate?.getTime() ?? null,
    completedAt: ctx.props.completedAt?.getTime() ?? null,
    estimatedMinutes: ctx.props.estimatedMinutes,
    actualMinutes: ctx.props.actualMinutes,
    comment: ctx.props.note,
    dependencyStatus: ctx.props.dependencyStatus,
    isBlocked: ctx.props.isBlocked,
    blockingReason: ctx.props.blockingReason,
    history: includeChildren ? ctx.history.map((h) => h.toClientDTO()) : undefined,
    instances: includeChildren ? ctx.instances.map((i) => i.toClientDTO()) : undefined,
    instanceCount: totalCount,
    completedInstanceCount: completedCount,
    pendingInstanceCount: pendingCount,
    completionRate,
  };
}
