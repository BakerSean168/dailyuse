/**
 * TaskTemplate factory functions.
 *
 * Extracted from TaskTemplate aggregate to keep the aggregate focused on
 * behavior and invariants.
 */

import type {
  TaskGoalBindingTrigger as TaskGoalBindingTriggerValue,
} from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskTemplateStatus } from '../../domain-shared/value-objects/task-template-status';
import { TaskTemplateId } from '../../domain-shared/value-objects/task-template-id';
import { TaskFolderId } from '../../domain-shared/value-objects/task-folder-id';
import { IdentityId } from '@dailyuse/domain-shared';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/primitives';
import type { TaskEventMap } from '@dailyuse/contracts/task';

import {
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
} from '../value-objects';
import { DependencyStatus, TaskType } from '../value-objects';
import { InvalidTaskTemplateStateError, InvalidDateRangeError } from '../value-objects/task-errors';
import { TaskTemplate, type TaskTemplateState } from './task-template';

// ============ Factory Functions ============

/** Convenience factory: creates a one-time task. */
export function createOneTimeTask(params: {
  identityId: IdentityId;
  title: string;
  description?: string;
  importance?: ImportanceLevel;
  startDate?: Date;
  dueDate?: Date;
  estimatedMinutes?: number;
  note?: string;
  goalId?: GoalId;
  keyResultId?: KeyResultId;
  parentTaskId?: TaskTemplateId;
  folderId?: TaskFolderId;
  tags?: string[];
  color?: string;
}): TaskTemplate {
  if (!params.identityId) {
    throw new InvalidTaskTemplateStateError('Identity ID is required', {
      templateId: '',
      currentStatus: 'N/A',
      attemptedAction: 'createOneTimeTask',
    });
  }
  if (!params.title || params.title.trim().length === 0) {
    throw new InvalidTaskTemplateStateError('Title is required', {
      templateId: '',
      currentStatus: 'N/A',
      attemptedAction: 'createOneTimeTask',
    });
  }
  assertValidDateRange(params.startDate ?? null, params.dueDate ?? null);

  const now = new Date();
  const template = TaskTemplate._create({
    id: TaskTemplateId.generate(),
    identityId: params.identityId,
    title: params.title.trim(),
    description: params.description || null,
    taskType: TaskType.OneTime,
    importance: (params.importance ?? ImportanceLevel.Moderate) as ImportanceLevel,
    tags: params.tags ?? [],
    color: params.color || null,
    status: TaskTemplateStatus.Active,
    folderId: params.folderId || null,
    goalId: params.goalId || null,
    keyResultId: params.keyResultId || null,
    goalBinding: null,
    checklist: [],
    parentTaskId: params.parentTaskId || null,
    timeConfig: null,
    recurrenceRule: null,
    reminderConfig: null,
    lastGeneratedDate: null,
    generateAheadDays: null,
    startDate: params.startDate || null,
    dueDate: params.dueDate || null,
    completedAt: null,
    estimatedMinutes: params.estimatedMinutes || null,
    actualMinutes: null,
    note: params.note || null,
    dependencyStatus: DependencyStatus.Waiting,
    isBlocked: false,
    blockingReason: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
  });

  template.addHistory('created', { taskType: TaskType.OneTime });
  return template;
}

/** Convenience factory: creates a recurring task. */
export function createRecurringTask(params: {
  identityId: IdentityId;
  title: string;
  description?: string;
  timeConfig: TaskTimeConfig;
  recurrenceRule: RecurrenceRule;
  reminderConfig?: TaskReminderConfig;
  importance?: ImportanceLevel;
  folderId?: TaskFolderId;
  tags?: string[];
  color?: string;
  generateAheadDays?: number;
}): TaskTemplate {
  if (!params.identityId) {
    throw new InvalidTaskTemplateStateError('Identity ID is required', {
      templateId: '',
      currentStatus: 'N/A',
      attemptedAction: 'createRecurringTask',
    });
  }
  if (!params.title || params.title.trim().length === 0) {
    throw new InvalidTaskTemplateStateError('Title is required', {
      templateId: '',
      currentStatus: 'N/A',
      attemptedAction: 'createRecurringTask',
    });
  }
  const now = new Date();
  const template = TaskTemplate._create({
    id: TaskTemplateId.generate(),
    identityId: params.identityId,
    title: params.title.trim(),
    description: params.description || null,
    taskType: TaskType.Recurring,
    timeConfig: params.timeConfig,
    recurrenceRule: params.recurrenceRule,
    reminderConfig: params.reminderConfig || null,
    importance: (params.importance ?? ImportanceLevel.Moderate) as ImportanceLevel,
    goalBinding: null,
    folderId: params.folderId || null,
    goalId: null,
    keyResultId: null,
    checklist: [],
    parentTaskId: null,
    lastGeneratedDate: null,
    startDate: null,
    dueDate: null,
    completedAt: null,
    estimatedMinutes: null,
    actualMinutes: null,
    note: null,
    dependencyStatus: DependencyStatus.None,
    isBlocked: false,
    blockingReason: null,
    tags: params.tags ?? [],
    color: params.color || null,
    status: TaskTemplateStatus.Active,
    generateAheadDays: params.generateAheadDays ?? 30,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
  });

  template.addHistory('created', { taskType: TaskType.Recurring });
  return template;
}

/** General factory: creates a new task template. */
export function createTaskTemplate(params: {
  identityId: IdentityId;
  title: string;
  description?: string;
  taskType: TaskType;
  timeConfig: TaskTimeConfig;
  recurrenceRule?: RecurrenceRule;
  reminderConfig?: TaskReminderConfig;
  importance?: ImportanceLevel;
  folderId?: TaskFolderId;
  tags?: string[];
  color?: string;
  generateAheadDays?: number;
  goalBinding?: {
    goalId: string;
    keyResultId: string;
    goalRecordValue: number;
    progressTrigger: TaskGoalBindingTriggerValue;
  } | null;
  parentTaskId?: TaskTemplateId;
}): TaskTemplate {
  if (!params.identityId) {
    throw new InvalidTaskTemplateStateError('Identity ID is required', {
      templateId: '',
      currentStatus: 'N/A',
      attemptedAction: 'create',
    });
  }
  if (!params.title || params.title.trim().length === 0) {
    throw new InvalidTaskTemplateStateError('Title is required', {
      templateId: '',
      currentStatus: 'N/A',
      attemptedAction: 'create',
    });
  }
  if (!params.timeConfig) {
    throw new InvalidTaskTemplateStateError('Time configuration is required', {
      templateId: '',
      currentStatus: 'N/A',
      attemptedAction: 'create',
    });
  }
  if (params.taskType === TaskType.Recurring && !params.recurrenceRule) {
    throw new InvalidTaskTemplateStateError('Recurrence rule is required for Recurring tasks', {
      templateId: '',
      currentStatus: 'N/A',
      attemptedAction: 'create',
    });
  }

  const now = new Date();
  const template = TaskTemplate._create({
    id: TaskTemplateId.generate(),
    identityId: params.identityId,
    title: params.title.trim(),
    description: params.description ?? null,
    taskType: params.taskType,
    timeConfig: params.timeConfig,
    recurrenceRule: params.recurrenceRule ?? null,
    reminderConfig: params.reminderConfig ?? null,
    importance: (params.importance ?? ImportanceLevel.Moderate) as ImportanceLevel,
    goalBinding: params.goalBinding
      ? TaskGoalBinding.fromDTO({
          ...params.goalBinding,
          goalId: params.goalBinding.goalId as GoalId,
          keyResultId: params.goalBinding.keyResultId as KeyResultId,
        })
      : null,
    folderId: params.folderId ?? null,
    goalId: (params.goalBinding?.goalId as GoalId | undefined) ?? null,
    keyResultId: (params.goalBinding?.keyResultId as KeyResultId | undefined) ?? null,
    checklist: [],
    parentTaskId: params.parentTaskId ?? null,
    lastGeneratedDate: null,
    startDate: null,
    dueDate: null,
    completedAt: null,
    estimatedMinutes: null,
    actualMinutes: null,
    note: null,
    dependencyStatus: DependencyStatus.None,
    isBlocked: false,
    blockingReason: null,
    tags: params.tags ?? [],
    color: params.color ?? null,
    status: TaskTemplateStatus.Active,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    generateAheadDays: params.generateAheadDays ?? 30,
    version: 1,
  });

  template.addHistory('created');
  template.publishDomainEvent<TaskEventMap['task:created']>('task:created', {
    identityId: params.identityId,
    task: template.toServerDTO(),
    templateId: template.id,
    goalId: template.goalBinding?.goalId ?? null,
  });

  return template;
}

/** Factory method: restores an aggregate from persisted state. */
export function loadTaskTemplate(state: TaskTemplateState): TaskTemplate {
  return TaskTemplate._create(state);
}

// ============ Helpers ============

function assertValidDateRange(
  startDate: Date | null | undefined,
  dueDate: Date | null | undefined,
): void {
  if (!startDate || !dueDate) {
    return;
  }

  const start = startDate.getTime();
  const due = dueDate.getTime();

  if (start > due) {
    throw new InvalidDateRangeError(start, due);
  }
}
