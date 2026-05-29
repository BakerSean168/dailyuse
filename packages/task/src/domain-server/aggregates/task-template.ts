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
  RecurrenceEndConditionType,
  TaskGoalBindingTrigger,
} from '@dailyuse/contracts/task';
import { DependencyStatus, TaskType } from '../value-objects';
import { ImportanceLevel, PriorityLevel } from '@dailyuse/contracts/shared';
import { TaskTemplateStatus } from '../../domain-shared/value-objects/task-template-status';
import { TaskTemplateId } from '../../domain-shared/value-objects/task-template-id';
import { TaskFolderId } from '../../domain-shared/value-objects/task-folder-id';
import { IdentityId } from '@dailyuse/domain-shared';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/primitives';
import { startOfDay } from 'date-fns';

import { AggregateRoot } from '@dailyuse/utils/domain';
import {
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
  ChecklistItemDefinition,
} from '../value-objects';
import { TaskTemplateHistory } from '../entities';
import { TaskInstance } from './task-instance';
import * as instanceGen from './instance-generation.policy';
import * as dtoHelper from './task-template-dto';
import * as goalPolicy from './task-template-goal.policy';
import * as lifecyclePolicy from './task-template-lifecycle.policy';
import * as oneTimePolicy from './task-template-onetime.policy';
import * as recurrencePolicy from './task-template-recurrence.policy';
import {
  InvalidTaskTemplateStateError,
  InvalidDateRangeError,
} from '../value-objects/task-errors';

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

  // ===== Constructor (protected, use factory methods to create) =====
  protected constructor(state: TaskTemplateState) {
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

  /** Internal factory — used by task-template-factory.ts to bypass protected constructor. */
  static _create(state: TaskTemplateState): TaskTemplate {
    return new TaskTemplate(state);
  }

  /** Publish a domain event — used by factory after construction. */
  publishDomainEvent<T>(eventName: string, payload: T): void {
    this.addDomainEvent(eventName, payload);
  }

  private static assertValidDateRange(
    startDate: Date | null | undefined,
    dueDate: Date | null | undefined,
  ): void {
    if (!startDate || !dueDate) return;
    if (startDate.getTime() > dueDate.getTime()) {
      throw new InvalidDateRangeError(startDate.getTime(), dueDate.getTime());
    }
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

  /** Internal props — used by extracted policy modules. */
  get props(): Omit<TaskTemplateState, 'id'> {
    return this._props;
  }

  // ===== Instance Generation Methods (delegated to instance-generation.policy) =====

  /** Generates task instances within the specified date range. */
  public generateInstances(fromDate: number, toDate: number): TaskInstance[] {
    const { instances, lastGeneratedDate } = instanceGen.generateInstances(this.getInstanceContext(), fromDate, toDate);
    this._instances.push(...instances);
    if (lastGeneratedDate) {
      this._props.lastGeneratedDate = lastGeneratedDate;
      this._props.updatedAt = new Date();
      this.addDomainEvent<TaskEventMap['task:instance-generated']>('task:instance-generated', {
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
    return this._instances.find((i) => TaskTemplate.startOfLocalDay(i.instanceDate) === targetDay) ?? null;
  }

  /** Determines whether an instance should be generated for the given date. */
  public shouldGenerateInstance(date: number): boolean {
    return instanceGen.shouldGenerateInstance(this.getInstanceContext(), date);
  }

  private getInstanceContext(): instanceGen.InstanceGenerationContext {
    return {
      templateId: this.id,
      identityId: this._props.identityId,
      status: this._props.status,
      taskType: this._props.taskType,
      timeConfig: this._props.timeConfig,
      recurrenceRule: this._props.recurrenceRule,
      importance: this._props.importance,
      existingInstances: this._instances,
    };
  }

  // ===== State Transition Methods (delegated to task-template-lifecycle.policy) =====

  public activate(): void {
    lifecyclePolicy.activate(this);
  }

  public pause(): void {
    lifecyclePolicy.pause(this);
  }

  public archive(): void {
    lifecyclePolicy.archive(this);
  }

  public softDelete(): void {
    lifecyclePolicy.softDelete(this);
  }

  public restore(): void {
    lifecyclePolicy.restore(this);
  }

  // ===== Time-related methods (delegated to instance-generation.policy) =====

  public isActiveOnDate(date: number): boolean {
    return instanceGen.isActiveOnDate(this.getInstanceContext(), date);
  }

  public getNextOccurrence(afterDate: number): number | null {
    return instanceGen.getNextOccurrence(this.getInstanceContext(), afterDate);
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
    this.addDomainEvent<TaskEventMap['task:updated']>('task:updated', {
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

    this.addDomainEvent<TaskEventMap['task:updated']>('task:updated', {
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

    this.addDomainEvent<TaskEventMap['task:template-schedule-time-changed']>(
      'task:template-schedule-time-changed',
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

    this.addDomainEvent<TaskEventMap['task:template-schedule-time-changed']>(
      'task:template-schedule-time-changed',
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

    this.addDomainEvent<TaskEventMap['task:template-schedule-time-changed']>(
      'task:template-schedule-time-changed',
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

  // ===== Recurrence Methods (delegated to task-template-recurrence.policy) =====

  public updateRecurrenceRule(newRule: RecurrenceRule): void {
    recurrencePolicy.updateRecurrenceRule(this, newRule);
  }

  public updateRecurrenceEndCondition(
    endConditionType: RecurrenceEndConditionType,
    customValue?: number,
  ): void {
    recurrencePolicy.updateRecurrenceEndCondition(this, endConditionType, customValue);
  }

  /** Updates the importance level. */
  public updatePriority(newImportance: ImportanceLevel): void {
    const oldImportance = this._props.importance;
    this._props.importance = newImportance;
    this._props.updatedAt = new Date();
    this.addHistory('priority_updated', { oldImportance, newImportance });

    this.addDomainEvent<TaskEventMap['task:updated']>('task:updated', {
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

    // Standardized fallback: return 1 hour before (real implementation should use reminder configuration offset)
    const ONE_HOUR_MS = 3600000;
    return instanceDate - ONE_HOUR_MS;
  }

  // ===== Goal Binding Methods (delegated to task-template-goal.policy) =====

  public bindToGoal(
    goalId: string,
    keyResultId: string,
    goalRecordValue?: number,
    progressTrigger: TaskGoalBindingTriggerValue = TaskGoalBindingTrigger.PerInstance,
  ): void {
    goalPolicy.bindToGoal(this, goalId, keyResultId, goalRecordValue, progressTrigger);
  }

  public unbindFromGoal(): void {
    goalPolicy.unbindFromGoal(this);
  }

  public isLinkedToGoal(): boolean {
    return goalPolicy.isLinkedToGoal(this._props);
  }

  public linkToGoal(goalId: string, keyResultId?: string): void {
    goalPolicy.linkToGoal(this, goalId, keyResultId);
  }

  public unlinkFromGoal(): void {
    goalPolicy.unlinkFromGoal(this);
  }

  // ===== Subtask Methods (delegated to task-template-onetime.policy) =====

  public addSubtask(subtaskId: string): void {
    oneTimePolicy.addSubtask(this, subtaskId);
  }

  public removeSubtask(subtaskId: string): void {
    oneTimePolicy.removeSubtask(this, subtaskId);
  }

  public isSubtask(): boolean {
    return oneTimePolicy.isSubtask(this._props);
  }

  public getParentTaskId(): string | null {
    return this._props.parentTaskId;
  }

  public updateParentTaskId(parentTaskId: TaskTemplateId | null): void {
    oneTimePolicy.updateParentTaskId(this, parentTaskId);
  }

  // ===== Priority Calculation (delegated to task-template-onetime.policy) =====

  public getPriority(): { level: PriorityLevel; score: number } {
    return oneTimePolicy.getPriority(this._props);
  }

  public getPriorityScore(): number {
    return this.getPriority().score;
  }

  public getPriorityLevel(): PriorityLevel {
    return this.getPriority().level;
  }

  // ===== Dependency Management (delegated to task-template-onetime.policy) =====

  public markAsBlocked(reason: string, dependencyTaskId?: string): void {
    oneTimePolicy.markAsBlocked(this, reason, dependencyTaskId);
  }

  public markAsReady(): void {
    oneTimePolicy.markAsReady(this);
  }

  public updateDependencyStatus(status: DependencyStatus): void {
    oneTimePolicy.updateDependencyStatus(this, status);
  }

  // ===== History Methods =====

  /** Adds a history record. */
  public addHistory(action: string, changes?: unknown): void {
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
  public createInstance(params: instanceGen.CreateInstanceParams): string {
    const instance = instanceGen.createInstanceFromTemplate(this.getInstanceContext(), params);
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

  // ===== DTO Conversion (delegated to task-template-dto) =====

  public toServerDTO(includeChildren: boolean = false): TaskTemplateServerDTO {
    return dtoHelper.toServerDTO(this, includeChildren);
  }

  public toClientDTO(includeChildren: boolean = false): TaskTemplateClientDTO {
    return dtoHelper.toClientDTO(this, includeChildren);
  }

  // ===== Factory Methods (delegated to task-template-factory) =====

  public static createOneTimeTask: typeof import('./task-template-factory').createOneTimeTask =
    (...args) => factory.createOneTimeTask(...args);

  public static createRecurringTask: typeof import('./task-template-factory').createRecurringTask =
    (...args) => factory.createRecurringTask(...args);

  public static create: typeof import('./task-template-factory').createTaskTemplate =
    (...args) => factory.createTaskTemplate(...args);

  public static load(state: TaskTemplateState): TaskTemplate {
    return factory.loadTaskTemplate(state);
  }

  static startOfLocalDay(value: number): number {
    return startOfDay(new Date(value)).getTime();
  }
}

// Lazy import to avoid circular dependency at module load time
import * as factory from './task-template-factory';
