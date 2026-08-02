/**
 * Task domain test fixtures
 *
 * Provides factory functions for creating task domain objects in tests.
 * Uses the domain's own factory methods to ensure valid objects.
 */

import { IdentityId } from '@memoflow/domain-shared';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { DayOfWeek, TaskType } from '@memoflow/contracts/task';
import { anIdentityId } from '@memoflow/test-utils/fixtures';
import {
  TaskTemplateId,
  TaskInstanceId,
  TaskFolderId,
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  CompletionRecord,
  ChecklistItemDefinition,
  TaskTemplateStatus,
} from '../server/domain';
import { TaskInstance, TaskTemplate } from '../server/domain';
import type { TaskTemplateState } from '../server/domain';

function titleFor(prefix: string): string {
  return `${prefix} ${Math.random().toString(36).slice(2, 8)}`;
}

/** Residual 1033: anIdentityId dual retired onto @memoflow/test-utils/fixtures sole. */
export { anIdentityId };

export interface OneTimeTaskOverrides {
  identityId?: IdentityId;
  title?: string;
  description?: string;
  importance?: ImportanceLevel;
  startDate?: number;
  dueDate?: number;
  estimatedMinutes?: number;
  note?: string;
  folderId?: TaskFolderId;
  tags?: string[];
  color?: string;
}

export function aOneTimeTask(overrides: OneTimeTaskOverrides = {}): TaskTemplate {
  return TaskTemplate.createOneTimeTask({
    identityId: overrides.identityId ?? anIdentityId(),
    title: overrides.title ?? titleFor('Task'),
    description: overrides.description,
    importance: overrides.importance ?? ImportanceLevel.Moderate,
    startDate: overrides.startDate,
    dueDate: overrides.dueDate,
    estimatedMinutes: overrides.estimatedMinutes,
    note: overrides.note,
    folderId: overrides.folderId,
    tags: overrides.tags,
    color: overrides.color,
  });
}

export interface RecurringTaskOverrides {
  identityId?: IdentityId;
  title?: string;
  description?: string;
  importance?: ImportanceLevel;
  timeConfig?: TaskTimeConfig;
  recurrenceRule?: RecurrenceRule;
  reminderConfig?: TaskReminderConfig;
  folderId?: TaskFolderId;
  tags?: string[];
  color?: string;
  generateAheadDays?: number;
}

export function aRecurringTask(overrides: RecurringTaskOverrides = {}): TaskTemplate {
  return TaskTemplate.createRecurringTask({
    identityId: overrides.identityId ?? anIdentityId(),
    title: overrides.title ?? titleFor('Recurring Task'),
    description: overrides.description,
    importance: overrides.importance ?? ImportanceLevel.Moderate,
    timeConfig: overrides.timeConfig ?? anAllDayTimeConfig(),
    recurrenceRule: overrides.recurrenceRule ?? aDailyRecurrenceRule(),
    reminderConfig: overrides.reminderConfig,
    folderId: overrides.folderId,
    tags: overrides.tags,
    color: overrides.color,
    generateAheadDays: overrides.generateAheadDays,
  });
}

export function aTaskTemplateState(overrides: Partial<TaskTemplateState> = {}): TaskTemplateState {
  const id = overrides.id ?? TaskTemplateId.generate();
  const now = Date.now();

  return {
    id,
    identityId: overrides.identityId ?? anIdentityId(),
    title: overrides.title ?? titleFor('Task'),
    description: overrides.description ?? null,
    taskType: overrides.taskType ?? TaskType.OneTime,
    importance: overrides.importance ?? ImportanceLevel.Moderate,
    tags: overrides.tags ?? [],
    color: overrides.color ?? null,
    status: overrides.status ?? TaskTemplateStatus.Active,
    folderId: overrides.folderId ?? null,
    goalBinding: overrides.goalBinding ?? null,
    checklist: overrides.checklist ?? [],
    parentTaskId: overrides.parentTaskId ?? null,
    timeConfig: overrides.timeConfig ?? null,
    recurrenceRule: overrides.recurrenceRule ?? null,
    reminderConfig: overrides.reminderConfig ?? null,
    lastGeneratedDate: overrides.lastGeneratedDate ?? null,
    generateAheadDays: overrides.generateAheadDays ?? null,
    startDate: overrides.startDate ?? null,
    dueDate: overrides.dueDate ?? null,
    completedAt: overrides.completedAt ?? null,
    estimatedMinutes: overrides.estimatedMinutes ?? null,
    actualMinutes: overrides.actualMinutes ?? null,
    note: overrides.note ?? null,
    dependencyStatus: overrides.dependencyStatus ?? 'None',
    isBlocked: overrides.isBlocked ?? false,
    blockingReason: overrides.blockingReason ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
    version: overrides.version ?? 1,
  };
}

export function aLoadedTaskTemplate(overrides: Partial<TaskTemplateState> = {}): TaskTemplate {
  return TaskTemplate.load(aTaskTemplateState(overrides));
}

export interface TaskInstanceOverrides {
  templateId?: TaskTemplateId;
  identityId?: IdentityId;
  instanceDate?: number;
  timeConfig?: TaskTimeConfig;
  importance?: ImportanceLevel;
}

export async function aTaskInstance(overrides: TaskInstanceOverrides = {}) {
  return TaskInstance.create({
    templateId: overrides.templateId ?? TaskTemplateId.generate(),
    identityId: overrides.identityId ?? anIdentityId(),
    instanceDate: overrides.instanceDate ?? Date.now(),
    timeConfig: overrides.timeConfig ?? anAllDayTimeConfig(),
    importance: overrides.importance ?? ImportanceLevel.Moderate,
  });
}

export function anAllDayTimeConfig(startDate?: Date): TaskTimeConfig {
  return TaskTimeConfig.createAllDay(startDate ?? new Date());
}

export function aTimePointConfig(timePoint = 540, startDate?: Date): TaskTimeConfig {
  return TaskTimeConfig.createTimePoint(startDate ?? new Date(), timePoint);
}

export function aTimeRangeConfig(start = 540, end = 600, startDate?: Date): TaskTimeConfig {
  return TaskTimeConfig.createTimeRange(startDate ?? new Date(), start, end);
}

export function aDailyRecurrenceRule(interval = 1): RecurrenceRule {
  return RecurrenceRule.createDaily(interval);
}

export function aWeeklyRecurrenceRule(
  daysOfWeek: DayOfWeek[] = [
    DayOfWeek.Monday,
    DayOfWeek.Tuesday,
    DayOfWeek.Wednesday,
    DayOfWeek.Thursday,
    DayOfWeek.Friday,
  ],
  interval = 1,
): RecurrenceRule {
  return RecurrenceRule.createWeekly(daysOfWeek, interval);
}

export function aDisabledReminderConfig(): TaskReminderConfig {
  return TaskReminderConfig.createDefault();
}

export function aRelativeReminder(value = 15, unit = 'Minutes' as const): TaskReminderConfig {
  return TaskReminderConfig.createRelativeReminder(value, unit);
}

export function aCompletionRecord(completedAt?: number): CompletionRecord {
  return CompletionRecord.complete(completedAt);
}

export function aCompletionWithDuration(
  durationMinutes = 30,
  completedAt?: number,
): CompletionRecord {
  return CompletionRecord.completeWithDuration(durationMinutes, completedAt);
}

export function aChecklist(...titles: string[]): ChecklistItemDefinition[] {
  if (titles.length === 0) {
    titles = ['Step 1', 'Step 2', 'Step 3'];
  }
  return ChecklistItemDefinition.fromTitles(titles);
}

export function aTaskTemplateId(value?: string): TaskTemplateId {
  if (value) return TaskTemplateId.of(value);
  return TaskTemplateId.generate();
}

export function aTaskInstanceId(value?: string): TaskInstanceId {
  if (value) return TaskInstanceId.of(value);
  return TaskInstanceId.generate();
}

export function aTaskFolderId(value?: string): TaskFolderId {
  if (value) return TaskFolderId.of(value);
  return TaskFolderId.generate();
}
