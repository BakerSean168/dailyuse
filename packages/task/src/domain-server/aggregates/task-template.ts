/**
 * TaskTemplate aggregate (Server)
 */

import type {
  TaskTemplateClientDTO,
  TaskTemplateServerDTO,
  TaskEventMap,
  TaskGoalBindingTrigger as TaskGoalBindingTriggerValue,
} from '@dailyuse/contracts/task';
import {
  RecurrenceFrequency,
  RecurrenceEndConditionType,
  TaskGoalBindingTrigger,
} from '@dailyuse/contracts/task';
import { TaskTimeType as TimeType, TaskInstanceStatus } from '../../domain-shared/value-objects';
import { DependencyStatus, TaskType } from '../value-objects';
import { ImportanceLevel, PriorityLevel } from '@dailyuse/contracts/shared';
import { TaskTemplateStatus } from '../../domain-shared/value-objects/task-template-status';
import { TaskTemplateId } from '../../domain-shared/value-objects/task-template-id';
import { TaskFolderId } from '../../domain-shared/value-objects/task-folder-id';
import { IdentityId } from '@dailyuse/domain-shared';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/primitives';
import { differenceInCalendarDays, differenceInCalendarWeeks, startOfDay } from 'date-fns';

import { AggregateRoot } from '@dailyuse/utils';
import { addDays } from 'date-fns';
import { calculateTaskPriority } from '../services/priority-calculator.service';
import {
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
  ChecklistItemDefinition,
} from '../value-objects';
import { TaskTemplateHistory } from '../entities';
import { TaskInstance } from './task-instance';
import {
  TaskTemplateNotFoundError,
  InvalidTaskTemplateStateError,
  TaskTemplateArchivedError,
  RecurrenceRuleNotImplementedError,
  InvalidGoalBindingError,
  InvalidDateRangeError,
  InstanceGenerationFailedError,
} from '../value-objects/TaskErrors';

/**
 * Internal state interface - all fields are required
 */
export interface TaskTemplateState {
  id: TaskTemplateId;
  identityId: IdentityId;
  title: string;
  description: string | null;
  taskType: TaskType;
  importance: ImportanceLevel;
  tags: string[];
  color: string | null;
  status: TaskTemplateStatus;
  folderId: TaskFolderId | null;
  goalId: GoalId | null;
  keyResultId: KeyResultId | null;
  goalBinding: TaskGoalBinding | null;
  checklist: ChecklistItemDefinition[];
  parentTaskId: TaskTemplateId | null;
  timeConfig: TaskTimeConfig | null;
  recurrenceRule: RecurrenceRule | null;
  reminderConfig: TaskReminderConfig | null;
  lastGeneratedDate: Date | null;
  generateAheadDays: number | null;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  note: string | null;
  dependencyStatus: DependencyStatus;
  isBlocked: boolean;
  blockingReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

/** TaskTemplate aggregate root. */
export class TaskTemplate extends AggregateRoot<TaskTemplateId> {
  private _props: Omit<TaskTemplateState, 'id'>;
  private static readonly DAY_MS = 86400000;

  // ===== Child entity collections =====
  private _history: TaskTemplateHistory[];
  private _instances: TaskInstance[];

  // ===== Constructor (private, use factory methods to create) =====
  private constructor(state: TaskTemplateState) {
    super(state.id);

    const { id: _, ...rest } = state;
    this._props = {
      ...rest,
      description: rest.description ?? null,
      color: rest.color ?? null,
      folderId: rest.folderId ?? null,
      goalId: rest.goalId ?? null,
      keyResultId: rest.keyResultId ?? null,
      goalBinding: rest.goalBinding ?? null,
      parentTaskId: rest.parentTaskId ?? null,
      timeConfig: rest.timeConfig ?? null,
      recurrenceRule: rest.recurrenceRule ?? null,
      reminderConfig: rest.reminderConfig ?? null,
      lastGeneratedDate: rest.lastGeneratedDate ?? null,
      generateAheadDays: rest.generateAheadDays ?? null,
      checklist: rest.checklist ?? [],
      startDate: rest.startDate ?? null,
      dueDate: rest.dueDate ?? null,
      completedAt: rest.completedAt ?? null,
      estimatedMinutes: rest.estimatedMinutes ?? null,
      actualMinutes: rest.actualMinutes ?? null,
      note: rest.note ?? null,
      dependencyStatus: rest.dependencyStatus ?? DependencyStatus.None,
      isBlocked: rest.isBlocked ?? false,
      blockingReason: rest.blockingReason ?? null,
      deletedAt: rest.deletedAt ?? null,
      version: rest.version ?? 1,
    };

    this._history = [];
    this._instances = [];
  }

  // ===== Getters =====

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get name(): string {
    return this._props.title;
  }

  public get title(): string {
    return this._props.title;
  }

  public get description(): string | null {
    return this._props.description;
  }

  public get taskType(): TaskType {
    return this._props.taskType;
  }

  public get timeConfig(): TaskTimeConfig | null {
    return this._props.timeConfig;
  }

  public get recurrenceRule(): RecurrenceRule | null {
    return this._props.recurrenceRule;
  }

  public get reminderConfig(): TaskReminderConfig | null {
    return this._props.reminderConfig;
  }

  public get importance(): ImportanceLevel {
    return this._props.importance;
  }

  public get goalBinding(): TaskGoalBinding | null {
    return this._props.goalBinding;
  }

  public get folderId(): TaskFolderId | null {
    return this._props.folderId;
  }

  public get tags(): string[] {
    return [...this._props.tags];
  }

  public get color(): string | null {
    return this._props.color;
  }

  public get status(): TaskTemplateStatus {
    return this._props.status;
  }

  public get lastGeneratedDate(): Date | null {
    return this._props.lastGeneratedDate;
  }

  public get generateAheadDays(): number | null {
    return this._props.generateAheadDays;
  }

  public get checklist(): ChecklistItemDefinition[] {
    return [...this._props.checklist];
  }

  // ===== Additional Getters =====

  public get goalId(): GoalId | null {
    return this._props.goalId;
  }

  public get keyResultId(): KeyResultId | null {
    return this._props.keyResultId;
  }

  public get parentTaskId(): TaskTemplateId | null {
    return this._props.parentTaskId;
  }

  public get startDate(): Date | null {
    return this._props.startDate;
  }

  public get dueDate(): Date | null {
    return this._props.dueDate;
  }

  public get completedAt(): Date | null {
    return this._props.completedAt;
  }

  public get estimatedMinutes(): number | null {
    return this._props.estimatedMinutes;
  }

  public get actualMinutes(): number | null {
    return this._props.actualMinutes;
  }

  public get note(): string | null {
    return this._props.note;
  }

  public get dependencyStatus(): DependencyStatus {
    return this._props.dependencyStatus;
  }

  public get isBlocked(): boolean {
    return this._props.isBlocked;
  }

  public get blockingReason(): string | null {
    return this._props.blockingReason;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  public get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  public get version(): number {
    return this._props.version;
  }

  public get history(): TaskTemplateHistory[] {
    return this._history;
  }

  public get instances(): TaskInstance[] {
    return [...this._instances];
  }

  // ===== Instance Generation Methods =====

  /** Generates task instances within the specified date range. */
  public generateInstances(fromDate: number, toDate: number): TaskInstance[] {
    // Validate date range
    if (fromDate >= toDate) {
      throw new InvalidDateRangeError(fromDate, toDate);
    }

    // Check if template is archived
    if (this._props.status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }

    const instances: TaskInstance[] = [];

    // Only generate instances for active templates
    if (this._props.status !== TaskTemplateStatus.Active) {
      throw new InvalidTaskTemplateStateError('Can only generate instances for active templates', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'generateInstances',
      });
    }

    if (this._props.taskType === TaskType.OneTime) {
      // One-time task: generate instance if startDate exists
      // Reason: even if outside date range, user still needs the instance
      if (this._props.timeConfig?.startDate) {
        const targetDay = TaskTemplate.startOfLocalDay(this._props.timeConfig.startDate.getTime());
        // Check if already generated to avoid duplicates
        const alreadyGenerated = this._instances.some(
          (inst) => TaskTemplate.startOfLocalDay(inst.instanceDate) === targetDay,
        );

        if (!alreadyGenerated) {
          const instance = TaskInstance.create({
            templateId: this.id,
            identityId: this._props.identityId,
            instanceDate: targetDay,
            timeConfig: this._props.timeConfig,
            importance: this._props.importance,
          });
          instances.push(instance);
          this._instances.push(instance);
        }
      }
    } else if (
      this._props.taskType === TaskType.Recurring &&
      this._props.recurrenceRule &&
      this._props.timeConfig
    ) {
      const fromDay = TaskTemplate.startOfLocalDay(fromDate);
      const endDate = TaskTemplate.startOfLocalDay(toDate);
      const maxOccurrences = this._props.recurrenceRule.occurrences;
      const existingInstanceCount = this._instances.filter(
        (instance) => !instance.deletedAt,
      ).length;

      if (maxOccurrences !== null && existingInstanceCount >= maxOccurrences) {
        return [];
      }

      let currentDate = fromDay;

      while (
        currentDate <= endDate &&
        (maxOccurrences === null || existingInstanceCount + instances.length < maxOccurrences)
      ) {
        if (this.shouldGenerateInstance(currentDate)) {
          const instance = TaskInstance.create({
            templateId: this.id,
            identityId: this._props.identityId,
            instanceDate: currentDate,
            timeConfig: this._props.timeConfig,
            importance: this._props.importance,
          });
          instances.push(instance);
          this._instances.push(instance);
        }
        // Move to next day
        currentDate = addDays(new Date(currentDate), 1).getTime();
      }
    }

    if (instances.length > 0) {
      this._props.lastGeneratedDate = new Date(toDate);
      this._props.updatedAt = new Date();
      this.addDomainEvent<TaskEventMap['task:instances:generated']>('task:instances:generated', {
        identityId: this._props.identityId,
        templateId: this.id,
        templateTitle: this.title,
        instanceCount: instances.length,
        strategy: instances.length <= 20 ? 'full' : 'summary',
      });
    }

    return instances;
  }

  /** Gets the task instance for a specific date. */
  public getInstanceForDate(date: number): TaskInstance | null {
    const targetDay = TaskTemplate.startOfLocalDay(date);
    return (
      this._instances.find((i) => {
        return TaskTemplate.startOfLocalDay(i.instanceDate) === targetDay;
      }) ?? null
    );
  }

  /** Determines whether an instance should be generated for the given date. */
  public shouldGenerateInstance(date: number): boolean {
    if (this._props.status !== TaskTemplateStatus.Active) {
      return false;
    }

    if (this._props.taskType === TaskType.OneTime) {
      return false; // Handled separately for one-time tasks
    }

    if (!this._props.recurrenceRule) {
      return false;
    }

    const candidateDay = TaskTemplate.startOfLocalDay(date);

    if (this._props.timeConfig?.startDate) {
      const templateStartDay = TaskTemplate.startOfLocalDay(
        this._props.timeConfig.startDate.getTime(),
      );
      if (candidateDay < templateStartDay) {
        return false;
      }
    }

    // Check if within recurrence rule validity period
    if (
      this._props.recurrenceRule.endDate &&
      candidateDay > TaskTemplate.startOfLocalDay(this._props.recurrenceRule.endDate.getTime())
    ) {
      return false;
    }

    if (
      this._props.recurrenceRule.occurrences !== null &&
      this._instances.filter((instance) => !instance.deletedAt).length >=
        this._props.recurrenceRule.occurrences
    ) {
      return false;
    }

    // Check recurrence rule
    const rule = this._props.recurrenceRule;
    const dateObj = new Date(candidateDay);

    switch (rule.frequency) {
      case RecurrenceFrequency.Daily:
        if (!this._props.timeConfig?.startDate) {
          return true;
        }

        return (
          differenceInCalendarDays(dateObj, new Date(this._props.timeConfig.startDate.getTime())) %
            rule.interval ===
          0
        );

      case RecurrenceFrequency.Weekly:
        if (!this._props.timeConfig?.startDate) {
          return false;
        }

        if (
          differenceInCalendarWeeks(dateObj, new Date(this._props.timeConfig.startDate.getTime()), {
            weekStartsOn: 1,
          }) %
            rule.interval !==
          0
        ) {
          return false;
        }

        const dayOfWeek = dateObj.getDay();
        return rule.daysOfWeek.includes(dayOfWeek as any);

      case RecurrenceFrequency.Monthly:
        // Monthly on specified date (simplified implementation)
        return true;

      case RecurrenceFrequency.Yearly:
        // Yearly on specified date
        return true;

      default:
        return false;
    }
  }

  // ===== State Transition Methods =====

  /** Activates the template. */
  public activate(): void {
    if (this._props.status === TaskTemplateStatus.Deleted) {
      throw new InvalidTaskTemplateStateError('Cannot activate a deleted template', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'activate',
      });
    }
    if (this._props.status === TaskTemplateStatus.Active) {
      throw new InvalidTaskTemplateStateError('Template is already active', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'activate',
      });
    }
    this._props.status = TaskTemplateStatus.Active;
    this._props.updatedAt = new Date();
    this.addHistory('resumed');
    this.addDomainEvent<TaskEventMap['task:template:resumed']>('task:template:resumed', {
      identityId: this._props.identityId,
      taskTemplateId: this.id,
      resumedAt: this._props.updatedAt.getTime(),
      taskTemplate: this.toServerDTO(),
    });
  }

  /** Pauses the template. */
  public pause(): void {
    if (this._props.status !== TaskTemplateStatus.Active) {
      throw new InvalidTaskTemplateStateError('Can only pause active templates', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'pause',
      });
    }
    this._props.status = TaskTemplateStatus.Paused;
    this._props.updatedAt = new Date();
    this.addHistory('Paused');
    this.addDomainEvent<TaskEventMap['task:template:paused']>('task:template:paused', {
      identityId: this._props.identityId,
      taskTemplateId: this.id,
      pausedAt: this._props.updatedAt.getTime(),
      taskTemplate: this.toServerDTO(),
    });
  }

  /** Archives the template. */
  public archive(): void {
    if (this._props.status === TaskTemplateStatus.Deleted) {
      throw new InvalidTaskTemplateStateError('Cannot archive a deleted template', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'archive',
      });
    }
    if (this._props.status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }
    this._props.status = TaskTemplateStatus.Archived;
    this._props.updatedAt = new Date();
    this.addHistory('Archived');
  }

  /** Soft-deletes the template. */
  public softDelete(): void {
    if (this._props.status === TaskTemplateStatus.Deleted) {
      throw new InvalidTaskTemplateStateError('Template is already deleted', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'softDelete',
      });
    }
    this._props.status = TaskTemplateStatus.Deleted;
    this._props.deletedAt = new Date();
    this._props.updatedAt = new Date();
    this.addHistory('Deleted');

    // Publish domain event
    this.addDomainEvent<TaskEventMap['task:delete']>('task:delete', {
      identityId: this._props.identityId,
      taskTemplateId: this.id,
      isSoftDelete: true,
      deletedAt: this._props.deletedAt.getTime(),
      task: this.toServerDTO(),
    });
  }

  /** Restores a soft-deleted template. */
  public restore(): void {
    if (this._props.status !== TaskTemplateStatus.Deleted) {
      throw new InvalidTaskTemplateStateError('Can only restore deleted templates', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'restore',
      });
    }
    this._props.status = TaskTemplateStatus.Active;
    this._props.deletedAt = null;
    this._props.updatedAt = new Date();
    this.addHistory('restored');
  }

  // ===== One-time task state methods (legacy) =====
  // NOTE: These methods are from a previous architecture iteration and should be
  // managed through TaskInstance status transitions instead.
  // TaskTemplate only manages template-level statuses (ACTIVE/PAUSED/ARCHIVED/DELETED).
  // Kept for backwards compatibility; should be removed in the future.

  // ===== Time-related methods =====

  /** Checks whether the template is active on a given date. */
  public isActiveOnDate(date: number): boolean {
    if (this._props.status !== TaskTemplateStatus.Active) {
      return false;
    }

    if (this._props.taskType === TaskType.OneTime) {
      return this._props.timeConfig?.startDate?.getTime() === date;
    }

    if (!this._props.recurrenceRule) {
      return false;
    }

    if (this._props.recurrenceRule.endDate && date > this._props.recurrenceRule.endDate.getTime()) {
      return false;
    }

    return true;
  }

  /** Gets the next occurrence date after the given date. */
  public getNextOccurrence(afterDate: number): number | null {
    if (this._props.status !== TaskTemplateStatus.Active) {
      return null;
    }

    if (this._props.taskType === TaskType.OneTime) {
      if (
        this._props.timeConfig?.startDate &&
        this._props.timeConfig.startDate.getTime() > afterDate
      ) {
        return this._props.timeConfig.startDate.getTime();
      }
      return null;
    }

    if (!this._props.recurrenceRule) {
      return null;
    }

    // Simplified: return next day (real implementation should follow recurrence rule)
    return afterDate + 86400000;
  }

  // ===== One-time task time methods =====

  /** Updates the title. */
  public updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new InvalidTaskTemplateStateError('Title cannot be empty', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'updateTitle',
      });
    }
    const oldTitle = this._props.title;
    this._props.title = newTitle.trim();
    this._props.updatedAt = new Date();
    this.addHistory('title_updated', { oldTitle, newTitle: this._props.title });

    // Publish domain event
    this.addDomainEvent<TaskEventMap['task:update']>('task:update', {
      identityId: this._props.identityId,
      task: this.toServerDTO(),
      changes: ['title'],
    });
  }

  /** Updates the description. */
  public updateDescription(newDescription: string | null): void {
    const oldDescription = this._props.description;
    this._props.description = newDescription ? newDescription.trim() : null;
    this._props.updatedAt = new Date();
    this.addHistory('description_updated', {
      oldDescription,
      newDescription: this._props.description,
    });
  }

  /** Updates the reminder configuration. */
  public updateReminderConfig(newReminderConfig: TaskReminderConfig | null): void {
    const oldReminderConfig = this._props.reminderConfig?.toDTO() ?? null;
    this._props.reminderConfig = newReminderConfig;
    this._props.updatedAt = new Date();
    this.addHistory('reminder_config_updated', {
      oldReminderConfig,
      newReminderConfig: newReminderConfig?.toDTO() ?? null,
    });

    this.addDomainEvent<TaskEventMap['task:update']>('task:update', {
      identityId: this._props.identityId,
      task: this.toServerDTO(),
      changes: ['reminderConfig'],
    });
  }

  /** Updates the start date (OneTime tasks only). */
  public updateStartDate(newStartDate: Date | null): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks have start dates', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'updateStartDate',
      });
    }
    TaskTemplate.assertValidDateRange(newStartDate, this._props.dueDate);
    const oldStartDate = this._props.startDate;
    this._props.startDate = newStartDate;
    this._props.updatedAt = new Date();
    this.addHistory('start_date_updated', { oldStartDate, newStartDate });

    this.addDomainEvent<TaskEventMap['task:template:schedule-time-changed']>(
      'task:template:schedule-time-changed',
      {
        identityId: this._props.identityId,
        taskTemplate: this.toServerDTO(),
        oldStartDate: oldStartDate,
        oldDueDate: this._props.dueDate,
        newStartDate: newStartDate,
        newDueDate: this._props.dueDate,
      },
    );
  }

  /** Updates the due date (OneTime tasks only). */
  public updateDueDate(newDueDate: Date | null): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks have due dates', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'updateDueDate',
      });
    }
    TaskTemplate.assertValidDateRange(this._props.startDate, newDueDate);
    // Note: TaskTemplateStatus doesn't have COMPLETED/CANCELLED states
    // Those are TaskInstanceStatus states. This check has been removed.
    const oldDueDate = this._props.dueDate;
    this._props.dueDate = newDueDate;
    this._props.updatedAt = new Date();
    this.addHistory('due_date_updated', { oldDueDate, newDueDate });

    this.addDomainEvent<TaskEventMap['task:template:schedule-time-changed']>(
      'task:template:schedule-time-changed',
      {
        identityId: this._props.identityId,
        taskTemplate: this.toServerDTO(),
        oldStartDate: this._props.startDate,
        oldDueDate: oldDueDate,
        newStartDate: this._props.startDate,
        newDueDate: newDueDate,
      },
    );
  }

  /**
   * Updates the time configuration.
   */
  public updateTimeConfig(newTimeConfig: TaskTimeConfig | null): void {
    const oldTimeConfig = this._props.timeConfig?.toDTO() ?? null;
    this._props.timeConfig = newTimeConfig;
    this._props.updatedAt = new Date();

    this.addHistory('time_config_updated', {
      oldTimeConfig,
      newTimeConfig: newTimeConfig?.toDTO() ?? null,
    });

    this.addDomainEvent<TaskEventMap['task:template:schedule-time-changed']>(
      'task:template:schedule-time-changed',
      {
        identityId: this._props.identityId,
        taskTemplate: this.toServerDTO(),
        oldStartDate: this._props.startDate,
        oldDueDate: this._props.dueDate,
        newStartDate: this._props.startDate,
        newDueDate: this._props.dueDate,
        oldTimeConfig,
        newTimeConfig: newTimeConfig?.toDTO() ?? null,
      },
    );
  }

  /** Updates the recurrence rule (Recurring tasks only). */
  public updateRecurrenceRule(newRule: RecurrenceRule): void {
    if (this._props.taskType !== TaskType.Recurring) {
      throw new InvalidTaskTemplateStateError('Only Recurring tasks have recurrence rules.', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'updateRecurrenceRule',
      });
    }
    const oldRuleDTO = this._props.recurrenceRule?.toDTO() ?? null;
    this._props.recurrenceRule = newRule;
    this._props.updatedAt = new Date();
    this.addHistory('recurrence_rule_updated', {
      oldRule: oldRuleDTO,
      newRule: newRule.toDTO(),
    });

    this.addDomainEvent<TaskEventMap['task:template:recurrence-changed']>(
      'task:template:recurrence-changed',
      {
        identityId: this._props.identityId,
        taskTemplate: this.toServerDTO(),
        oldRecurrenceRule: oldRuleDTO,
        newRecurrenceRule: newRule.toDTO(),
      },
    );
  }

  /**
   * Updates the recurrence end condition using enum type and default values.
   *
   * @param endConditionType - End condition type
   * @param customValue - Custom value (e.g., number of occurrences)
   */
  public updateRecurrenceEndCondition(
    endConditionType: RecurrenceEndConditionType,
    customValue?: number,
  ): void {
    if (this._props.taskType !== TaskType.Recurring) {
      throw new InvalidTaskTemplateStateError('Only Recurring tasks have recurrence rules.', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'updateRecurrenceEndCondition',
      });
    }

    if (!this._props.recurrenceRule) {
      throw new InvalidTaskTemplateStateError('Recurrence rule is not set', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'updateRecurrenceEndCondition',
      });
    }

    let updatedRule: RecurrenceRule;

    switch (endConditionType) {
      case RecurrenceEndConditionType.Never:
        // No end condition: clear endDate and occurrences
        updatedRule = this._props.recurrenceRule.setEndDate(null).setOccurrences(null);
        break;

      case RecurrenceEndConditionType.EndDate:
        // End by date: use provided date or default to 30 days from now
        const endDate = customValue ?? Date.now() + 30 * 86400000; // Default: 30 days
        updatedRule = this._props.recurrenceRule.setEndDate(new Date(endDate));
        break;

      case RecurrenceEndConditionType.Occurrences:
        // End by occurrence count: use provided count or default to 10
        const occurrences = customValue ?? 10; // Default: 10
        updatedRule = this._props.recurrenceRule.setOccurrences(occurrences);
        break;

      default:
        throw new InvalidTaskTemplateStateError(`Invalid end condition type: ${endConditionType}`, {
          templateId: this.id,
          currentStatus: this._props.status,
          attemptedAction: 'updateRecurrenceEndCondition',
        });
    }

    const oldRuleDTO = this._props.recurrenceRule.toDTO();
    this._props.recurrenceRule = updatedRule;
    this._props.updatedAt = new Date();

    this.addHistory('recurrence_end_condition_updated', {
      oldRule: oldRuleDTO,
      newRule: updatedRule.toDTO(),
      endConditionType,
    });

    this.addDomainEvent<TaskEventMap['task:template:recurrence-changed']>(
      'task:template:recurrence-changed',
      {
        identityId: this._props.identityId,
        taskTemplate: this.toServerDTO(),
        oldRecurrenceRule: oldRuleDTO,
        newRecurrenceRule: updatedRule.toDTO(),
      },
    );
  }

  /** Updates the importance level. */
  public updatePriority(newImportance: ImportanceLevel): void {
    const oldImportance = this._props.importance;
    this._props.importance = newImportance;
    this._props.updatedAt = new Date();
    this.addHistory('priority_updated', { oldImportance, newImportance });

    this.addDomainEvent<TaskEventMap['task:update']>('task:update', {
      identityId: this._props.identityId,
      task: this.toServerDTO(),
      changes: ['importance'],
    });
  }

  /** Updates the tags. */
  public updateTags(newTags: string[]): void {
    const oldTags = [...this._props.tags];
    this._props.tags = [...new Set(newTags)]; // Deduplicate
    this._props.updatedAt = new Date();
    this.addHistory('tags_updated', { oldTags, newTags: this._props.tags });
  }

  /** Updates the color. */
  public updateColor(newColor: string | null): void {
    const oldColor = this._props.color;
    this._props.color = newColor;
    this._props.updatedAt = new Date();
    this.addHistory('color_updated', { oldColor, newColor });
  }

  /** Updates the note (OneTime tasks only). */
  public updateNote(newNote: string | null): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks have notes', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'updateNote',
      });
    }
    const oldNote = this._props.note;
    this._props.note = newNote;
    this._props.updatedAt = new Date();
    this.addHistory('note_updated', { oldNote, newNote });
  }

  /** Updates the estimated time (OneTime tasks only). */
  public updateEstimatedTime(estimatedMinutes: number): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks have estimated time', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'updateEstimatedTime',
      });
    }
    if (estimatedMinutes < 0) {
      throw new InvalidTaskTemplateStateError('Estimated time cannot be negative', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'updateEstimatedTime',
      });
    }
    const oldEstimatedMinutes = this._props.estimatedMinutes;
    this._props.estimatedMinutes = estimatedMinutes;
    this._props.updatedAt = new Date();
    this.addHistory('estimated_time_updated', { oldEstimatedMinutes, estimatedMinutes });
  }

  /** Checks whether the task is overdue (OneTime tasks only). */
  public isOverdue(): boolean {
    if (this._props.taskType !== TaskType.OneTime) {
      return false;
    }
    if (!this._props.dueDate) {
      return false;
    }
    // Note: TaskTemplateStatus doesn't have COMPLETED/CANCELLED states
    // Those checks have been removed as they belong to TaskInstance status
    return Date.now() > this._props.dueDate.getTime();
  }

  /** Gets the number of days until the due date (OneTime tasks only). */
  public getDaysUntilDue(): number | null {
    if (this._props.taskType !== TaskType.OneTime) {
      return null;
    }
    if (!this._props.dueDate) {
      return null;
    }
    const now = Date.now();
    const diffMs = this._props.dueDate.getTime() - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // ===== Reminder Methods =====

  /** Checks whether a reminder is configured. */
  public hasReminder(): boolean {
    return this._props.reminderConfig !== null && this._props.reminderConfig.enabled;
  }

  /** Gets the reminder time for a given instance date. */
  public getReminderTime(instanceDate: number): number | null {
    if (!this.hasReminder() || !this._props.reminderConfig) {
      return null;
    }

    return instanceDate - 3600000;
  }

  // ===== Goal Binding Methods =====

  /** Binds the template to a goal. */
  public bindToGoal(
    goalId: string,
    keyResultId: string,
    goalRecordValue: number,
    progressTrigger: TaskGoalBindingTriggerValue = TaskGoalBindingTrigger.PerInstance,
  ): void {
    // Validate parameters
    if (!goalId || !keyResultId) {
      throw new InvalidGoalBindingError('Goal ID and Key Result ID are required');
    }

    // Check if template is archived
    if (this._props.status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }

    this._props.goalBinding = TaskGoalBinding.fromDTO({
      goalId,
      keyResultId,
      goalRecordValue,
      progressTrigger,
    });
    this._props.goalId = goalId as GoalId;
    this._props.keyResultId = keyResultId as KeyResultId;
    this._props.updatedAt = new Date();
    this.addHistory('goal_bound', { goalId, keyResultId, goalRecordValue, progressTrigger });
  }

  /** Unbinds from the current goal. */
  public unbindFromGoal(): void {
    // Check if template has goal binding
    if (!this._props.goalBinding) {
      throw new InvalidGoalBindingError('Template is not bound to any goal');
    }

    // Check if template is archived
    if (this._props.status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }

    this._props.goalBinding = null;
    this._props.goalId = null;
    this._props.keyResultId = null;
    this._props.updatedAt = new Date();
    this.addHistory('goal_unbound');
  }

  /** Checks whether the template is linked to a goal. */
  public isLinkedToGoal(): boolean {
    return this._props.goalBinding !== null;
  }

  /** Links to a goal (OneTime tasks only, supports multiple fields). */
  public linkToGoal(goalId: string, keyResultId?: string): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks can be linked to goals', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'linkToGoal',
      });
    }
    if (this._props.goalId) {
      throw new InvalidTaskTemplateStateError('Task is already linked to a goal', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'linkToGoal',
      });
    }
    this._props.goalId = goalId as GoalId;
    this._props.keyResultId = keyResultId ? (keyResultId as KeyResultId) : null;
    this._props.updatedAt = new Date();
    this.addHistory('linked_to_goal', { goalId, keyResultId });
  }

  /** Unlinks from the current goal (OneTime tasks only). */
  public unlinkFromGoal(): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks can be unlinked from goals', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'unlinkFromGoal',
      });
    }
    if (!this._props.goalId) {
      throw new InvalidTaskTemplateStateError('Task is not linked to any goal', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'unlinkFromGoal',
      });
    }
    const oldGoalId = this._props.goalId;
    const oldKeyResultId = this._props.keyResultId;
    this._props.goalId = null;
    this._props.keyResultId = null;
    this._props.updatedAt = new Date();
    this.addHistory('unlinked_from_goal', { oldGoalId, oldKeyResultId });
  }

  // ===== Subtask Methods (OneTime) =====

  /** Adds a subtask. */
  public addSubtask(subtaskId: string): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks can have subtasks', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'addSubtask',
      });
    }
    // In practice, subtaskId existence should be verified via repository
    this._props.updatedAt = new Date();
    this.addHistory('subtask_added', { subtaskId });
  }

  /** Removes a subtask. */
  public removeSubtask(subtaskId: string): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks can have subtasks', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'removeSubtask',
      });
    }
    this._props.updatedAt = new Date();
    this.addHistory('subtask_removed', { subtaskId });
  }

  /** Checks whether this template is a subtask. */
  public isSubtask(): boolean {
    return this._props.parentTaskId !== null;
  }

  /** Gets the parent task ID. */
  public getParentTaskId(): string | null {
    return this._props.parentTaskId;
  }

  // ===== Priority Calculation Methods (OneTime) =====

  /**
   * Gets the priority level and score.
   *
   * Uses calculateTaskPriority with:
   * - Importance: from this task template
   * - Due Date: task deadline
   * - Current Time: reference time
   *
   * For one-time tasks: maps score to one of 5 priority levels.
   * For recurring tasks: returns default low priority.
   */
  public getPriority(): { level: PriorityLevel; score: number } {
    if (this._props.taskType !== TaskType.OneTime) {
      return { level: PriorityLevel.Low as PriorityLevel, score: 0 };
    }

    const currentTime = new Date();
    const dueDateObj = this._props.dueDate;

    const score = calculateTaskPriority(this._props.importance, dueDateObj, currentTime);
    const level = this.scoreToPriorityLevel(score);

    return { level, score };
  }

  /**
   * Maps a priority score to a priority level.
   *
   * Score ranges:
   * - [80, 100]: Critical - requires immediate action
   * - [60, 80): High - should be handled soon
   * - [40, 60): Medium - needs attention
   * - [20, 40): Low - can wait
   * - [0, 20): None - no urgency
   */
  private scoreToPriorityLevel(score: number): PriorityLevel {
    if (score >= 80) return PriorityLevel.Critical as PriorityLevel;
    if (score >= 60) return PriorityLevel.High as PriorityLevel;
    if (score >= 40) return PriorityLevel.Medium as PriorityLevel;
    if (score >= 20) return PriorityLevel.Low as PriorityLevel;
    return PriorityLevel.None as PriorityLevel;
  }

  /** Gets the priority score. */
  public getPriorityScore(): number {
    return this.getPriority().score;
  }

  /** Gets the priority level. */
  public getPriorityLevel(): PriorityLevel {
    return this.getPriority().level;
  }

  // ===== Dependency Management (OneTime) =====

  /** Marks the template as blocked. */
  public markAsBlocked(reason: string, dependencyTaskId?: string): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks can be blocked by dependencies', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'markAsBlocked',
      });
    }
    this._props.isBlocked = true;
    this._props.blockingReason = reason;
    this._props.dependencyStatus = DependencyStatus.Blocked;
    this._props.updatedAt = new Date();
    this.addHistory('marked_as_blocked', { reason, dependencyTaskId });
  }

  /** Marks the template as ready (dependencies resolved). */
  public markAsReady(): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks can have dependency status', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'markAsReady',
      });
    }
    this._props.isBlocked = false;
    this._props.blockingReason = null;
    this._props.dependencyStatus = DependencyStatus.Ready;
    this._props.updatedAt = new Date();
    this.addHistory('marked_as_ready');
  }

  /** Updates the dependency status. */
  public updateDependencyStatus(status: DependencyStatus): void {
    if (this._props.taskType !== TaskType.OneTime) {
      throw new InvalidTaskTemplateStateError('Only OneTime tasks can have dependency status', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'updateDependencyStatus',
      });
    }
    const oldStatus = this._props.dependencyStatus;
    this._props.dependencyStatus = status;
    this._props.updatedAt = new Date();
    this.addHistory('dependency_status_updated', { oldStatus, newStatus: status });
  }

  // ===== History Methods =====

  /** Adds a history record. */
  public addHistory(action: string, changes?: any): void {
    const history = TaskTemplateHistory.create({
      templateId: this.id,
      action,
      changes: changes ? JSON.stringify(changes) : null,
    });
    this._history.push(history);
    this._props.updatedAt = new Date();
  }

  // ===== Instance Management Methods =====

  /** Creates an instance from this template. */
  public createInstance(params: any): string {
    // Check if template is archived or deleted
    if (this._props.status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }
    if (this._props.status === TaskTemplateStatus.Deleted) {
      throw new InvalidTaskTemplateStateError('Cannot create instance from deleted template', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'createInstance',
      });
    }

    // Validate instance date
    if (!params.instanceDate || typeof params.instanceDate !== 'number') {
      throw new InvalidTaskTemplateStateError('Invalid instance date provided', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'createInstance',
      });
    }

    if (!this._props.timeConfig) {
      throw new Error('Cannot create instance without timeConfig');
    }

    const instance = TaskInstance.create({
      templateId: this.id,
      identityId: this._props.identityId,
      instanceDate: params.instanceDate,
      timeConfig: this._props.timeConfig,
      importance: this._props.importance,
    });
    this._instances.push(instance);
    this._props.updatedAt = new Date();
    return instance.id;
  }

  /** Adds an existing instance to this template. */
  public addInstance(instance: TaskInstance): void {
    this._instances.push(instance);
    this._props.updatedAt = new Date();
  }

  /** Removes an instance by ID. */
  public removeInstance(instanceId: string): TaskInstance | null {
    const index = this._instances.findIndex((i) => i.id === instanceId);
    if (index === -1) return null;
    const [removed] = this._instances.splice(index, 1);
    this._props.updatedAt = new Date();
    return removed;
  }

  /** Gets an instance by ID. */
  public getInstance(instanceId: string): TaskInstance | null {
    return this._instances.find((i) => i.id === instanceId) ?? null;
  }

  /** Gets all instances. */
  public getAllInstances(): TaskInstance[] {
    return [...this._instances];
  }

  // ===== DTO Conversion =====

  public toServerDTO(includeChildren: boolean = false): TaskTemplateServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.title,
      description: this._props.description,
      timeConfig: this._props.timeConfig?.toDTO() ?? null,
      recurrenceRule: this._props.recurrenceRule?.toDTO() ?? null,
      reminderConfig: this._props.reminderConfig?.toDTO() ?? null,
      importance: this._props.importance,
      priority: this._props.taskType === TaskType.OneTime ? this.getPriority().score : undefined,
      goalBinding: this._props.goalBinding?.toDTO() ?? null,
      checklist: this._props.checklist.map((c) => c.toDTO()),
      folderId: this._props.folderId,
      tags: [...this._props.tags],
      color: this._props.color,
      status: this._props.status,
      lastGeneratedDate: this._props.lastGeneratedDate?.getTime() ?? null,
      generateAheadDays: this._props.generateAheadDays,
      parentTaskId: this._props.parentTaskId,
      dependencyStatus: this._props.dependencyStatus,
      isBlocked: this._props.isBlocked,
      blockingReason: this._props.blockingReason,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      version: this._props.version,
      instances: includeChildren ? this._instances.map((i) => i.toServerDTO()) : undefined,
    };
  }

  public toClientDTO(includeChildren: boolean = false): TaskTemplateClientDTO {
    const completedCount = this._instances.filter(
      (i) => i.status === TaskInstanceStatus.Completed,
    ).length;
    const pendingCount = this._instances.filter(
      (i) => i.status === TaskInstanceStatus.Pending,
    ).length;
    const totalCount = this._instances.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // OneTime tasks include priority calculation
    const priority = this._props.taskType === TaskType.OneTime ? this.getPriority() : undefined;

    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.title,
      description: this._props.description,
      timeConfig: this._props.timeConfig?.toDTO() ?? {
        timeType: TimeType.AllDay,
        startDate: null,
        timePoint: null,
        timeRange: null,
      },
      recurrenceRule: this._props.recurrenceRule?.toDTO() ?? null,
      reminderConfig: this._props.reminderConfig?.toDTO() ?? null,
      importance: this._props.importance,
      priority: priority?.score,
      goalBinding: this._props.goalBinding?.toDTO() ?? null,
      folderId: this._props.folderId,
      tags: [...this._props.tags],
      color: this._props.color,
      status: this._props.status,
      lastGeneratedDate: this._props.lastGeneratedDate?.getTime() ?? null,
      generateAheadDays: this._props.generateAheadDays,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      version: this._props.version,
      parentTaskId: this._props.parentTaskId,
      startDate: this._props.startDate?.getTime() ?? null,
      dueDate: this._props.dueDate?.getTime() ?? null,
      completedAt: this._props.completedAt?.getTime() ?? null,
      estimatedMinutes: this._props.estimatedMinutes,
      actualMinutes: this._props.actualMinutes,
      comment: this._props.note,
      dependencyStatus: this._props.dependencyStatus,
      isBlocked: this._props.isBlocked,
      blockingReason: this._props.blockingReason,
      history: includeChildren ? this._history.map((h) => h.toClientDTO()) : undefined,
      instances: includeChildren ? this._instances.map((i) => i.toClientDTO()) : undefined,
      instanceCount: totalCount,
      completedInstanceCount: completedCount,
      pendingInstanceCount: pendingCount,
      completionRate,
    };
  }

  // ===== Factory Methods =====

  /** Convenience factory: creates a one-time task. */
  public static createOneTimeTask(params: {
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
    TaskTemplate.assertValidDateRange(params.startDate ?? null, params.dueDate ?? null);

    const now = new Date();
    const template = new TaskTemplate({
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
  public static createRecurringTask(params: {
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
    const template = new TaskTemplate({
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
  public static create(params: {
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
    const template = new TaskTemplate({
      id: TaskTemplateId.generate(),
      identityId: params.identityId,
      title: params.title.trim(),
      description: params.description ?? null,
      taskType: params.taskType,
      timeConfig: params.timeConfig,
      recurrenceRule: params.recurrenceRule ?? null,
      reminderConfig: params.reminderConfig ?? null,
      importance: (params.importance ?? ImportanceLevel.Moderate) as ImportanceLevel,
      goalBinding: params.goalBinding ? TaskGoalBinding.fromDTO(params.goalBinding) : null,
      folderId: params.folderId ?? null,
      goalId: (params.goalBinding?.goalId as GoalId | undefined) ?? null,
      keyResultId: (params.goalBinding?.keyResultId as KeyResultId | undefined) ?? null,
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
      color: params.color ?? null,
      status: TaskTemplateStatus.Active,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      generateAheadDays: params.generateAheadDays ?? 30,
      version: 1,
    });

    template.addHistory('created');
    template.addDomainEvent<TaskEventMap['task:create']>('task:create', {
      identityId: params.identityId,
      task: template.toServerDTO(),
      templateId: template.id,
      goalId: template.goalBinding?.goalId ?? null,
    });

    return template;
  }

  /** Factory method: restores an aggregate from persisted state. */
  public static load(state: TaskTemplateState): TaskTemplate {
    return new TaskTemplate(state);
  }

  private static assertValidDateRange(
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

  private static startOfLocalDay(value: number): number {
    return startOfDay(new Date(value)).getTime();
  }
}
