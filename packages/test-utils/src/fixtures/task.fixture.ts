/**
 * Task domain test fixtures
 *
 * Provides factory functions for creating task domain objects in tests.
 * Uses the domain's own factory methods to ensure valid objects —
 * no bypassing of invariants.
 *
 * @example
 * ```typescript
 * // Create a one-time task template with defaults
 * const template = aOneTimeTask();
 *
 * // Create with specific overrides
 * const template = aOneTimeTask({ title: 'Buy groceries', importance: ImportanceLevel.Vital });
 *
 * // Create a recurring task
 * const template = aRecurringTask({ title: 'Daily standup' });
 *
 * // Create a task instance
 * const instance = aTaskInstance({ templateId: template.id });
 *
 * // Create value objects directly
 * const timeConfig = anAllDayTimeConfig();
 * const rule = aDailyRecurrenceRule();
 * ```
 */

import { IdentityId } from '@dailyuse/domain-shared';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { DayOfWeek, TaskType } from '@dailyuse/contracts/modules/task';
import {
  TaskTemplateId,
  TaskInstanceId,
  TaskFolderId,
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
  CompletionRecord,
  ChecklistItemDefinition,
  TaskTemplateStatus,
  TaskInstanceStatus,
  TaskTimeType,
} from '@dailyuse/task/domain-shared';
import { TaskInstance, TaskTemplate } from '@dailyuse/task/domain-server';
import type { TaskTemplateState } from '@dailyuse/task/domain-server';

import { titleFor } from './base.fixture.js';
import { anIdentityId } from './account.fixture.js';

// ─── TaskTemplate Fixtures ───────────────────────────────────────────

/**
 * Parameters for creating a one-time task template fixture.
 * All fields are optional — sensible defaults are provided.
 */
export interface OneTimeTaskOverrides {
  identityId?: IdentityId;
  title?: string;
  description?: string;
  importance?: ImportanceLevel;
  startDate?: Date;
  dueDate?: Date;
  estimatedMinutes?: number;
  note?: string;
  folderId?: TaskFolderId;
  tags?: string[];
  color?: string;
}

/**
 * Create a one-time TaskTemplate aggregate with sensible defaults.
 *
 * Uses `TaskTemplate.createOneTimeTask()` — the domain's own factory —
 * so the result is a fully valid aggregate with domain events raised.
 */
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

/**
 * Parameters for creating a recurring task template fixture.
 */
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

/**
 * Create a recurring TaskTemplate aggregate with sensible defaults.
 *
 * Uses `TaskTemplate.createRecurringTask()` — defaults to a daily recurrence
 * with an all-day time config if not specified.
 */
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

/**
 * Load a TaskTemplate from raw state (bypasses factory, no events).
 * Useful for testing persistence reconstitution or state-dependent behavior.
 */
export function aTaskTemplateState(overrides: Partial<TaskTemplateState> = {}): TaskTemplateState {
  const id = overrides.id ?? TaskTemplateId.generate();
  const now = new Date();

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
    goalId: overrides.goalId ?? null,
    keyResultId: overrides.keyResultId ?? null,
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
    dependencyStatus: overrides.dependencyStatus ?? 'none',
    isBlocked: overrides.isBlocked ?? false,
    blockingReason: overrides.blockingReason ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
    version: overrides.version ?? 1,
  };
}

/**
 * Load a TaskTemplate aggregate from raw state overrides.
 * Uses `TaskTemplate.load()` — no validation or events.
 */
export function aLoadedTaskTemplate(overrides: Partial<TaskTemplateState> = {}): TaskTemplate {
  return TaskTemplate.load(aTaskTemplateState(overrides));
}

// ─── TaskInstance Fixtures ───────────────────────────────────────────

/**
 * Parameters for creating a task instance fixture.
 */
export interface TaskInstanceOverrides {
  templateId?: TaskTemplateId;
  identityId?: IdentityId;
  instanceDate?: number;
  timeConfig?: TaskTimeConfig;
  importance?: ImportanceLevel;
}

/**
 * Create a TaskInstance aggregate with sensible defaults.
 */
export async function aTaskInstance(overrides: TaskInstanceOverrides = {}) {
  return TaskInstance.create({
    templateId: overrides.templateId ?? TaskTemplateId.generate(),
    identityId: overrides.identityId ?? anIdentityId(),
    instanceDate: overrides.instanceDate ?? Date.now(),
    timeConfig: overrides.timeConfig ?? anAllDayTimeConfig(),
    importance: overrides.importance ?? ImportanceLevel.Moderate,
  });
}

// ─── Value Object Fixtures ──────────────────────────────────────────

/**
 * Create an AllDay TaskTimeConfig.
 */
export function anAllDayTimeConfig(startDate?: Date): TaskTimeConfig {
  return TaskTimeConfig.createAllDay(startDate ?? new Date());
}

/**
 * Create a TimePoint TaskTimeConfig.
 * @param timePoint - Minutes from midnight (0-1439). Default: 540 (9:00 AM)
 */
export function aTimePointConfig(timePoint = 540, startDate?: Date): TaskTimeConfig {
  return TaskTimeConfig.createTimePoint(startDate ?? new Date(), timePoint);
}

/**
 * Create a TimeRange TaskTimeConfig.
 * @param start - Start minutes from midnight. Default: 540 (9:00 AM)
 * @param end - End minutes from midnight. Default: 600 (10:00 AM)
 */
export function aTimeRangeConfig(start = 540, end = 600, startDate?: Date): TaskTimeConfig {
  return TaskTimeConfig.createTimeRange(startDate ?? new Date(), start, end);
}

/**
 * Create a daily RecurrenceRule.
 */
export function aDailyRecurrenceRule(interval = 1): RecurrenceRule {
  return RecurrenceRule.createDaily(interval);
}

/**
 * Create a weekly RecurrenceRule.
 * @param daysOfWeek - Days of week (0=Sun..6=Sat). Default: Mon-Fri
 */
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

/**
 * Create a disabled TaskReminderConfig (the default).
 */
export function aDisabledReminderConfig(): TaskReminderConfig {
  return TaskReminderConfig.createDefault();
}

/**
 * Create a relative reminder (e.g., 15 minutes before).
 */
export function aRelativeReminder(value = 15, unit = 'Minutes' as const): TaskReminderConfig {
  return TaskReminderConfig.createRelativeReminder(value, unit);
}

/**
 * Create a CompletionRecord (marks a task as done now).
 */
export function aCompletionRecord(completedAt?: Date): CompletionRecord {
  return CompletionRecord.complete(completedAt);
}

/**
 * Create a CompletionRecord with duration.
 */
export function aCompletionWithDuration(
  durationMinutes = 30,
  completedAt?: Date,
): CompletionRecord {
  return CompletionRecord.completeWithDuration(durationMinutes, completedAt);
}

/**
 * Create a list of ChecklistItemDefinitions from titles.
 */
export function aChecklist(...titles: string[]): ChecklistItemDefinition[] {
  if (titles.length === 0) {
    titles = ['Step 1', 'Step 2', 'Step 3'];
  }
  return ChecklistItemDefinition.fromTitles(titles);
}

// ─── ID Generators ──────────────────────────────────────────────────

/**
 * Generate a branded TaskTemplateId.
 */
export function aTaskTemplateId(value?: string): TaskTemplateId {
  if (value) return TaskTemplateId.of(value);
  return TaskTemplateId.generate();
}

/**
 * Generate a branded TaskInstanceId.
 */
export function aTaskInstanceId(value?: string): TaskInstanceId {
  if (value) return TaskInstanceId.of(value);
  return TaskInstanceId.generate();
}

/**
 * Generate a branded TaskFolderId.
 */
export function aTaskFolderId(value?: string): TaskFolderId {
  if (value) return TaskFolderId.of(value);
  return TaskFolderId.generate();
}
