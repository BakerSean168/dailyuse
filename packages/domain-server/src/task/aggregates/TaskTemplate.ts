/**
 * TaskTemplate 聚合根实�?(Server)
 * 任务模板 - 聚合�?
 */

import type { TaskTemplateClientDTO, TaskTemplatePersistenceDTO, TaskTemplateServer, TaskTemplateServerDTO } from '@dailyuse/contracts/task';
import { RecurrenceFrequency, TimeType } from '@dailyuse/contracts/task';
import {
  TaskType,
  TaskTemplateStatus,
  RecurrenceEndConditionType,
} from '@dailyuse/contracts/task';
import { ImportanceLevel, PriorityLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils';
import { calculateTaskPriority } from '../services/priority-calculator.service';
import {
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
} from '../value-objects';
import { TaskTemplateHistory } from '../entities';
import { TaskInstance } from './TaskInstance';
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
 * TaskTemplate 聚合�?
 *
 * DDD 聚合根职责：
 * - 管理任务模板的生命周�?
 * - 管理任务实例的生�?
 * - 管理历史记录
 * - 执行业务规则
 * - 是事务边�?
 */
export class TaskTemplate extends AggregateRoot implements TaskTemplateServer {
  // ===== 通用字段 =====
  private _accountUuid: string;
  private _title: string;
  private _description: string | null;
  private _taskType: TaskType; // 'ONE_TIME' | 'RECURRING'
  private _importance: ImportanceLevel;
  private _tags: string[];
  private _color: string | null;
  private _status: TaskTemplateStatus;
  private _folderUuid: string | null;

  // ===== Goal/KR 关联（通用�?=====
  private _goalUuid: string | null;
  private _keyResultUuid: string | null;
  private _goalBinding: TaskGoalBinding | null; // 仅循环任务的高级绑定

  // ===== 子任务支持（通用�?=====
  private _parentTaskUuid: string | null;

  // ===== 循环任务专用字段 =====
  private _timeConfig: TaskTimeConfig | null;
  private _recurrenceRule: RecurrenceRule | null;
  private _reminderConfig: TaskReminderConfig | null;
  private _lastGeneratedDate: number | null;
  private _generateAheadDays: number | null;

  // ===== 一次性任务专用字�?=====
  private _startDate: number | null;
  private _dueDate: number | null;
  private _completedAt: number | null;
  private _estimatedMinutes: number | null;
  private _actualMinutes: number | null;
  private _note: string | null;

  // ===== 依赖关系（通用�?=====
  private _dependencyStatus: string; // 'NONE' | 'WAITING' | 'READY' | 'BLOCKED'
  private _isBlocked: boolean;
  private _blockingReason: string | null;

  // ===== 审计字段 =====
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt: number | null;

  // ===== 子实体集�?=====
  private _history: TaskTemplateHistory[];
  private _instances: TaskInstance[]; // �?RECURRING 使用

  // ===== 构造函数（私有，通过工厂方法创建�?=====
  private constructor(props: TaskTemplateProps, uuid?: string) {
    super(uuid || AggregateRoot.generateUUID());

    // 通用字段
    this._accountUuid = props.accountUuid;
    this._title = props.title;
    this._description = props.description ?? null;
    this._taskType = props.taskType;
    this._importance = props.importance;
    this._tags = props.tags;
    this._color = props.color ?? null;
    this._status = props.status;
    this._folderUuid = props.folderUuid ?? null;

    // Goal/KR 关联
    this._goalUuid = props.goalUuid ?? null;
    this._keyResultUuid = props.keyResultUuid ?? null;
    this._goalBinding = props.goalBinding ?? null;

    // 子任务支�?
    this._parentTaskUuid = props.parentTaskUuid ?? null;

    // 循环任务专用
    this._timeConfig = props.timeConfig ?? null;
    this._recurrenceRule = props.recurrenceRule ?? null;
    this._reminderConfig = props.reminderConfig ?? null;
    this._lastGeneratedDate = props.lastGeneratedDate ?? null;
    this._generateAheadDays = props.generateAheadDays ?? null;

    // 一次性任务专�?
    this._startDate = props.startDate ?? null;
    this._dueDate = props.dueDate ?? null;
    this._completedAt = props.completedAt ?? null;
    this._estimatedMinutes = props.estimatedMinutes ?? null;
    this._actualMinutes = props.actualMinutes ?? null;
    this._note = props.note ?? null;

    // 依赖关系
    this._dependencyStatus = props.dependencyStatus ?? 'NONE';
    this._isBlocked = props.isBlocked ?? false;
    this._blockingReason = props.blockingReason ?? null;

    // 审计字段
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt ?? null;

    // 子实�?
    this._history = [];
    this._instances = [];
  }

  // ===== Getter 属�?=====
  public override get uuid(): string {
    return this._uuid;
  }

  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string | null {
    return this._description;
  }

  public get taskType(): TaskType {
    return this._taskType;
  }

  public get timeConfig(): TaskTimeConfig | null {
    return this._timeConfig;
  }

  public get recurrenceRule(): RecurrenceRule | null {
    return this._recurrenceRule;
  }

  public get reminderConfig(): TaskReminderConfig | null {
    return this._reminderConfig;
  }

  public get importance(): ImportanceLevel {
    return this._importance;
  }

  public get goalBinding(): TaskGoalBinding | null {
    return this._goalBinding;
  }

  public get folderUuid(): string | null {
    return this._folderUuid;
  }

  public get tags(): string[] {
    return [...this._tags];
  }

  public get color(): string | null {
    return this._color;
  }

  public get status(): TaskTemplateStatus {
    return this._status;
  }

  public get lastGeneratedDate(): number | null {
    return this._lastGeneratedDate;
  }

  public get generateAheadDays(): number | null {
    return this._generateAheadDays;
  }

  // === 新增 Getter（一次性任务和通用�?===

  public get goalUuid(): string | null {
    return this._goalUuid;
  }

  public get keyResultUuid(): string | null {
    return this._keyResultUuid;
  }

  public get parentTaskUuid(): string | null {
    return this._parentTaskUuid;
  }

  public get startDate(): number | null {
    return this._startDate;
  }

  public get dueDate(): number | null {
    return this._dueDate;
  }

  public get completedAt(): number | null {
    return this._completedAt;
  }

  public get estimatedMinutes(): number | null {
    return this._estimatedMinutes;
  }

  public get actualMinutes(): number | null {
    return this._actualMinutes;
  }

  public get note(): string | null {
    return this._note;
  }

  public get dependencyStatus(): string {
    return this._dependencyStatus;
  }

  public get isBlocked(): boolean {
    return this._isBlocked;
  }

  public get blockingReason(): string | null {
    return this._blockingReason;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  public get updatedAt(): number {
    return this._updatedAt;
  }

  public get deletedAt(): number | null {
    return this._deletedAt;
  }

  public get history(): TaskTemplateHistory[] {
    return this._history;
  }

  public get instances(): TaskInstance[] {
    return [...this._instances];
  }

  // ===== 实例生成方法 =====

  /**
   * 生成指定日期范围内的任务实例
   */
  public generateInstances(fromDate: number, toDate: number): TaskInstance[] {
    // Validate date range
    if (fromDate >= toDate) {
      throw new InvalidDateRangeError(fromDate, toDate);
    }

    // Check if template is archived
    if (this._status === 'ARCHIVED') {
      throw new TaskTemplateArchivedError(this.uuid);
    }

    const instances: TaskInstance[] = [];

    // Only generate instances for active templates
    if (this._status !== 'ACTIVE') {
      throw new InvalidTaskTemplateStateError('Can only generate instances for active templates', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'generateInstances',
      });
    }

    if (this._taskType === TaskType.ONE_TIME) {
      // 单次任务：只要有 startDate 就生成实例（不限制日期范围）
      // 原因：单次任务可能在未来很远的日期，用户仍然需要看�?
      if (this._timeConfig?.startDate) {
        // 检查是否已经生成过（避免重复生成）
        const alreadyGenerated = this._instances.some(
          (inst) => inst.instanceDate === this._timeConfig!.startDate,
        );

        if (!alreadyGenerated) {
          const instance = TaskInstance.create({
            templateUuid: this.uuid,
            accountUuid: this._accountUuid,
            instanceDate: this._timeConfig.startDate,
            timeConfig: this._timeConfig,
            importance: this._importance,
          });
          instances.push(instance);
          this._instances.push(instance);
        }
      }
    } else if (this._taskType === TaskType.RECURRING && this._recurrenceRule && this._timeConfig) {
      // 重复任务：根据重复规则生成多个实例（限制在日期范围内�?
      let currentDate = fromDate;
      while (currentDate <= toDate) {
        if (this.shouldGenerateInstance(currentDate)) {
          const instance = TaskInstance.create({
            templateUuid: this.uuid,
            accountUuid: this._accountUuid,
            instanceDate: currentDate,
            timeConfig: this._timeConfig,
            importance: this._importance,
          });
          instances.push(instance);
          this._instances.push(instance);
        }
        // 移动到下一�?
        currentDate += 86400000;
      }
    }

    if (instances.length > 0) {
      this._lastGeneratedDate = toDate;
      this._updatedAt = Date.now();
    }

    return instances;
  }

  /**
   * 获取指定日期的任务实�?
   */
  public getInstanceForDate(date: number): TaskInstance | null {
    return (
      this._instances.find((i) => {
        const instanceDay = new Date(i.instanceDate).setHours(0, 0, 0, 0);
        const targetDay = new Date(date).setHours(0, 0, 0, 0);
        return instanceDay === targetDay;
      }) ?? null
    );
  }

  /**
   * 判断是否应该在指定日期生成实�?
   */
  public shouldGenerateInstance(date: number): boolean {
    if (this._status !== 'ACTIVE') {
      return false;
    }

    if (this._taskType === 'ONE_TIME') {
      return false; // 单次任务不在此判�?
    }

    if (!this._recurrenceRule) {
      return false;
    }

    // 检查是否在重复规则的有效期�?
    if (this._recurrenceRule.endDate && date > this._recurrenceRule.endDate) {
      return false;
    }

    // 检查频�?
    const rule = this._recurrenceRule;
    const dateObj = new Date(date);

    switch (rule.frequency) {
      case 'DAILY':
        return true; // 每天都生�?

      case 'WEEKLY':
        // 检查是否在指定的星期几
        const dayOfWeek = dateObj.getDay();
        return rule.daysOfWeek.includes(dayOfWeek as any);

      case 'MONTHLY':
        // 每月的指定日�?
        // 这里简化处理，实际应该更复�?
        return true;

      case 'YEARLY':
        // 每年的指定日�?
        return true;

      default:
        return false;
    }
  }

  // ===== 状态管理方�?=====

  /**
   * 激活模�?
   */
  public activate(): void {
    if (this._status === 'DELETED') {
      throw new InvalidTaskTemplateStateError('Cannot activate a deleted template', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'activate',
      });
    }
    if (this._status === 'ACTIVE') {
      throw new InvalidTaskTemplateStateError('Template is already active', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'activate',
      });
    }
    this._status = 'ACTIVE' as TaskTemplateStatus;
    this._updatedAt = Date.now();
    this.addHistory('resumed');
  }

  /**
   * 暂停模板
   */
  public pause(): void {
    if (this._status !== 'ACTIVE') {
      throw new InvalidTaskTemplateStateError('Can only pause active templates', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'pause',
      });
    }
    this._status = 'PAUSED' as TaskTemplateStatus;
    this._updatedAt = Date.now();
    this.addHistory('paused');
  }

  /**
   * 归档模板
   */
  public archive(): void {
    if (this._status === 'DELETED') {
      throw new InvalidTaskTemplateStateError('Cannot archive a deleted template', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'archive',
      });
    }
    if (this._status === 'ARCHIVED') {
      throw new TaskTemplateArchivedError(this.uuid);
    }
    this._status = 'ARCHIVED' as TaskTemplateStatus;
    this._updatedAt = Date.now();
    this.addHistory('archived');
  }

  /**
   * 软删除模�?
   */
  public softDelete(): void {
    if (this._status === 'DELETED') {
      throw new InvalidTaskTemplateStateError('Template is already deleted', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'softDelete',
      });
    }
    this._status = 'DELETED' as TaskTemplateStatus;
    this._deletedAt = Date.now();
    this._updatedAt = Date.now();
    this.addHistory('deleted');
  }

  /**
   * 恢复模板
   */
  public restore(): void {
    if (this._status !== 'DELETED') {
      throw new InvalidTaskTemplateStateError('Can only restore deleted templates', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'restore',
      });
    }
    this._status = 'ACTIVE' as TaskTemplateStatus;
    this._deletedAt = null;
    this._updatedAt = Date.now();
    this.addHistory('restored');
  }

  // ===== 一次性任务状态管理方�?=====
  // NOTE: 这些方法已废弃。根据新架构，单次任务也应该通过 TaskInstance 来管理状态�?
  // TaskTemplate 只负责模板管理（ACTIVE/PAUSED/ARCHIVED/DELETED）�?
  // 保留这些方法只是为了向后兼容，未来应该移除�?

  // ===== 时间规则方法 =====

  /**
   * 判断模板在指定日期是否活�?
   */
  public isActiveOnDate(date: number): boolean {
    if (this._status !== TaskTemplateStatus.ACTIVE) {
      return false;
    }

    if (this._taskType === TaskType.ONE_TIME) {
      return this._timeConfig?.startDate === date;
    }

    if (!this._recurrenceRule) {
      return false;
    }

    if (this._recurrenceRule.endDate && date > this._recurrenceRule.endDate) {
      return false;
    }

    return true;
  }

  /**
   * 获取指定日期之后的下一次发生时�?
   */
  public getNextOccurrence(afterDate: number): number | null {
    if (this._status !== TaskTemplateStatus.ACTIVE) {
      return null;
    }

    if (this._taskType === TaskType.ONE_TIME) {
      if (this._timeConfig?.startDate && this._timeConfig.startDate > afterDate) {
        return this._timeConfig.startDate;
      }
      return null;
    }

    if (!this._recurrenceRule) {
      return null;
    }

    // 简化实现：返回下一天（实际应该根据重复规则计算�?
    return afterDate + 86400000;
  }

  // ===== 一次性任务时间管理方�?=====

  /**
   * 更新标题
   */
  public updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new InvalidTaskTemplateStateError('Title cannot be empty', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'updateTitle',
      });
    }
    const oldTitle = this._title;
    this._title = newTitle.trim();
    this._updatedAt = Date.now();
    this.addHistory('title_updated', { oldTitle, newTitle: this._title });
  }

  /**
   * 更新描述
   */
  public updateDescription(newDescription: string | null): void {
    const oldDescription = this._description;
    this._description = newDescription ? newDescription.trim() : null;
    this._updatedAt = Date.now();
    this.addHistory('description_updated', { oldDescription, newDescription: this._description });
  }

  /**
   * 更新开始时�?(ONE_TIME)
   */
  public updateStartDate(newStartDate: number | null): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have start dates', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'updateStartDate',
      });
    }
    const oldStartDate = this._startDate;
    this._startDate = newStartDate;
    this._updatedAt = Date.now();
    this.addHistory('start_date_updated', { oldStartDate, newStartDate });

    this.addDomainEvent({
      eventType: 'task_template.schedule_time_changed',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        taskTemplate: this.toServerDTO(),
        oldStartDate: oldStartDate,
        oldDueDate: this._dueDate,
        newStartDate: newStartDate,
        newDueDate: this._dueDate,
      },
    });
  }

  /**
   * 更新截止时间 (ONE_TIME)
   */
  public updateDueDate(newDueDate: number | null): void {
    if (this._taskType !== TaskType.ONE_TIME) {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have due dates', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'updateDueDate',
      });
    }
    // Note: TaskTemplateStatus doesn't have COMPLETED/CANCELLED states
    // Those are TaskInstanceStatus states. This check has been removed.
    const oldDueDate = this._dueDate;
    this._dueDate = newDueDate;
    this._updatedAt = Date.now();
    this.addHistory('due_date_updated', { oldDueDate, newDueDate });

    this.addDomainEvent({
      eventType: 'task_template.schedule_time_changed',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        taskTemplate: this.toServerDTO(),
        oldStartDate: this._startDate,
        oldDueDate: oldDueDate,
        newStartDate: this._startDate,
        newDueDate: newDueDate,
      },
    });
  }

  /**
   * 更新重复规则 (RECURRING)
   */
  public updateRecurrenceRule(newRule: RecurrenceRule): void {
    if (this._taskType !== 'RECURRING') {
      throw new InvalidTaskTemplateStateError('Only RECURRING tasks have recurrence rules.', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'updateRecurrenceRule',
      });
    }
    const oldRuleDTO = this._recurrenceRule?.toServerDTO() ?? null;
    this._recurrenceRule = newRule;
    this._updatedAt = Date.now();
    this.addHistory('recurrence_rule_updated', {
      oldRule: oldRuleDTO,
      newRule: newRule.toServerDTO(),
    });

    this.addDomainEvent({
      eventType: 'task_template.recurrence_changed',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        taskTemplate: this.toServerDTO(),
        oldRecurrenceRule: oldRuleDTO,
        newRecurrenceRule: newRule.toServerDTO(),
      },
    });
  }

  /**
   * 更新重复规则的结束条件（使用枚举类型和默认值）
   * @param endConditionType 结束条件类型
   * @param customValue 自定义值（日期时间戳或重复次数�?
   */
  public updateRecurrenceEndCondition(
    endConditionType: RecurrenceEndConditionType,
    customValue?: number,
  ): void {
    if (this._taskType !== TaskType.RECURRING) {
      throw new InvalidTaskTemplateStateError('Only RECURRING tasks have recurrence rules.', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'updateRecurrenceEndCondition',
      });
    }

    if (!this._recurrenceRule) {
      throw new InvalidTaskTemplateStateError('Recurrence rule is not set', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'updateRecurrenceEndCondition',
      });
    }

    let updatedRule: RecurrenceRule;

    switch (endConditionType) {
      case RecurrenceEndConditionType.NEVER:
        // 永不结束：清�?endDate �?occurrences
        updatedRule = this._recurrenceRule.withNeverEnd();
        break;

      case RecurrenceEndConditionType.END_DATE:
        // 指定日期结束：使用提供的日期，如果没有则默认�?30 天后
        const endDate = customValue ?? Date.now() + 30 * 86400000; // 默认 30 天后
        updatedRule = this._recurrenceRule.withEndDate(endDate);
        break;

      case RecurrenceEndConditionType.OCCURRENCES:
        // 指定次数结束：使用提供的次数，如果没有则默认�?10 �?
        const occurrences = customValue ?? 10; // 默认 10 �?
        updatedRule = this._recurrenceRule.withOccurrences(occurrences);
        break;

      default:
        throw new InvalidTaskTemplateStateError(`Invalid end condition type: ${endConditionType}`, {
          templateUuid: this.uuid,
          currentStatus: this._status,
          attemptedAction: 'updateRecurrenceEndCondition',
        });
    }

    const oldRuleDTO = this._recurrenceRule.toServerDTO();
    this._recurrenceRule = updatedRule;
    this._updatedAt = Date.now();

    this.addHistory('recurrence_end_condition_updated', {
      oldRule: oldRuleDTO,
      newRule: updatedRule.toServerDTO(),
      endConditionType,
    });

    this.addDomainEvent({
      eventType: 'task_template.recurrence_changed',
      aggregateId: this.uuid,
      occurredOn: new Date(this._updatedAt),
      accountUuid: this._accountUuid,
      payload: {
        taskTemplate: this.toServerDTO(),
        oldRecurrenceRule: oldRuleDTO,
        newRecurrenceRule: updatedRule.toServerDTO(),
      },
    });
  }

  /**
   * 更新优先�?
   */
  public updatePriority(newImportance: ImportanceLevel): void {
    const oldImportance = this._importance;
    this._importance = newImportance;
    this._updatedAt = Date.now();
    this.addHistory('priority_updated', { oldImportance, newImportance });
  }

  /**
   * 更新标签
   */
  public updateTags(newTags: string[]): void {
    const oldTags = [...this._tags];
    this._tags = [...new Set(newTags)]; // 去重
    this._updatedAt = Date.now();
    this.addHistory('tags_updated', { oldTags, newTags: this._tags });
  }

  /**
   * 更新颜色
   */
  public updateColor(newColor: string | null): void {
    const oldColor = this._color;
    this._color = newColor;
    this._updatedAt = Date.now();
    this.addHistory('color_updated', { oldColor, newColor });
  }

  /**
   * 更新备注 (ONE_TIME)
   */
  public updateNote(newNote: string | null): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have notes', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'updateNote',
      });
    }
    const oldNote = this._note;
    this._note = newNote;
    this._updatedAt = Date.now();
    this.addHistory('note_updated', { oldNote, newNote });
  }

  /**
   * 更新预估时间 (ONE_TIME)
   */
  public updateEstimatedTime(estimatedMinutes: number): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have estimated time', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'updateEstimatedTime',
      });
    }
    if (estimatedMinutes < 0) {
      throw new InvalidTaskTemplateStateError('Estimated time cannot be negative', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'updateEstimatedTime',
      });
    }
    const oldEstimatedMinutes = this._estimatedMinutes;
    this._estimatedMinutes = estimatedMinutes;
    this._updatedAt = Date.now();
    this.addHistory('estimated_time_updated', { oldEstimatedMinutes, estimatedMinutes });
  }

  /**
   * 判断是否逾期 (ONE_TIME)
   */
  public isOverdue(): boolean {
    if (this._taskType !== TaskType.ONE_TIME) {
      return false;
    }
    if (!this._dueDate) {
      return false;
    }
    // Note: TaskTemplateStatus doesn't have COMPLETED/CANCELLED states
    // Those checks have been removed as they belong to TaskInstance status
    return Date.now() > this._dueDate;
  }

  /**
   * 获取距离截止日期的天�?(ONE_TIME)
   */
  public getDaysUntilDue(): number | null {
    if (this._taskType !== TaskType.ONE_TIME) {
      return null;
    }
    if (!this._dueDate) {
      return null;
    }
    const now = Date.now();
    const diffMs = this._dueDate - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // ===== 提醒方法 =====

  /**
   * 是否有提�?
   */
  public hasReminder(): boolean {
    return this._reminderConfig !== null && this._reminderConfig.enabled;
  }

  /**
   * 获取指定实例日期的提醒时�?
   */
  public getReminderTime(instanceDate: number): number | null {
    if (!this.hasReminder() || !this._reminderConfig) {
      return null;
    }

    // 简化实现：返回实例日期�?小时
    // 实际应该根据提醒配置计算
    return instanceDate - 3600000;
  }

  // ===== 目标绑定方法 =====

  /**
   * 绑定到目�?
   */
  public bindToGoal(goalUuid: string, keyResultUuid: string, incrementValue: number): void {
    // Validate parameters
    if (!goalUuid || !keyResultUuid) {
      throw new InvalidGoalBindingError('Goal UUID and Key Result UUID are required', {
        goalUuid,
        reason: 'Missing required parameters',
      });
    }

    // Check if already bound
    if (this._goalBinding) {
      throw new InvalidGoalBindingError('Template is already bound to a goal', {
        goalUuid: this._goalBinding.goalUuid,
        reason: 'Template already has a goal binding',
      });
    }

    // Check if template is archived
    if (this._status === 'ARCHIVED') {
      throw new TaskTemplateArchivedError(this.uuid);
    }

    this._goalBinding = new TaskGoalBinding({
      goalUuid,
      keyResultUuid,
      incrementValue,
    });
    this._updatedAt = Date.now();
    this.addHistory('goal_bound', { goalUuid, keyResultUuid, incrementValue });
  }

  /**
   * 解除目标绑定
   */
  public unbindFromGoal(): void {
    // Check if template has goal binding
    if (!this._goalBinding) {
      throw new InvalidGoalBindingError('Template is not bound to any goal', {
        reason: 'No goal binding exists',
      });
    }

    // Check if template is archived
    if (this._status === 'ARCHIVED') {
      throw new TaskTemplateArchivedError(this.uuid);
    }

    this._goalBinding = null;
    this._updatedAt = Date.now();
    this.addHistory('goal_unbound');
  }

  /**
   * 是否绑定到目�?
   */
  public isLinkedToGoal(): boolean {
    return this._goalBinding !== null;
  }

  /**
   * 绑定到目�?(ONE_TIME) - 新版本支持新字段
   */
  public linkToGoal(goalUuid: string, keyResultUuid?: string): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can be linked to goals', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'linkToGoal',
      });
    }
    if (this._goalUuid) {
      throw new InvalidTaskTemplateStateError('Task is already linked to a goal', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'linkToGoal',
      });
    }
    this._goalUuid = goalUuid;
    this._keyResultUuid = keyResultUuid || null;
    this._updatedAt = Date.now();
    this.addHistory('linked_to_goal', { goalUuid, keyResultUuid });
  }

  /**
   * 解除目标链接 (ONE_TIME)
   */
  public unlinkFromGoal(): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can be unlinked from goals', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'unlinkFromGoal',
      });
    }
    if (!this._goalUuid) {
      throw new InvalidTaskTemplateStateError('Task is not linked to any goal', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'unlinkFromGoal',
      });
    }
    const oldGoalUuid = this._goalUuid;
    const oldKeyResultUuid = this._keyResultUuid;
    this._goalUuid = null;
    this._keyResultUuid = null;
    this._updatedAt = Date.now();
    this.addHistory('unlinked_from_goal', { oldGoalUuid, oldKeyResultUuid });
  }

  // ===== 子任务管理方�?(ONE_TIME) =====

  /**
   * 添加子任�?
   */
  public addSubtask(subtaskUuid: string): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have subtasks', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'addSubtask',
      });
    }
    // 实际实现中应该通过 repository 验证 subtaskUuid 是否存在
    this._updatedAt = Date.now();
    this.addHistory('subtask_added', { subtaskUuid });
  }

  /**
   * 移除子任�?
   */
  public removeSubtask(subtaskUuid: string): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have subtasks', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'removeSubtask',
      });
    }
    this._updatedAt = Date.now();
    this.addHistory('subtask_removed', { subtaskUuid });
  }

  /**
   * 判断是否是子任务
   */
  public isSubtask(): boolean {
    return this._parentTaskUuid !== null;
  }

  /**
   * 获取父任务UUID
   */
  public getParentTaskUuid(): string | null {
    return this._parentTaskUuid;
  }

  // ===== 优先级计算方�?(ONE_TIME) =====

  /**
   * 获取优先级等级和分数 (Story 1.2)
   * 
   * 使用纯函数 calculateTaskPriority 计算优先级分数，基于：
   * - Importance（重要性）：Task 实体固有属性
   * - Due Date（截止日期）：用于计算时间紧急程度
   * - Current Time（当前时间）：基准时间点
   * 
   * 对于一次性任务：根据分数映射到 5 级优先级等级
   * 对于循环任务：返回最低优先级
   */
  public getPriority(): { level: PriorityLevel; score: number } {
    if (this._taskType !== TaskType.ONE_TIME) {
      return { level: PriorityLevel.Low, score: 0 };
    }
    
    const currentTime = new Date();
    const dueDateObj = this._dueDate ? new Date(this._dueDate) : null;
    
    const score = calculateTaskPriority(this._importance, dueDateObj, currentTime);
    const level = this.scoreToPriorityLevel(score);
    
    return { level, score };
  }

  /**
   * 将优先级分数映射到优先级等级
   * 
   * 分数范围：[0, 100]
   * - [80, 100]: Critical（紧急）- 需要立即处理
   * - [60, 80): High（高）- 今天必须处理
   * - [40, 60): Medium（中）- 近期需要处理
   * - [20, 40): Low（低）- 可以稍后处理
   * - [0, 20): None（无）- 无具体时间要求
   */
  private scoreToPriorityLevel(score: number): PriorityLevel {
    if (score >= 80) return PriorityLevel.Critical;
    if (score >= 60) return PriorityLevel.High;
    if (score >= 40) return PriorityLevel.Medium;
    if (score >= 20) return PriorityLevel.Low;
    return PriorityLevel.None;
  }

  /**
   * 获取优先级分�?
   */
  public getPriorityScore(): number {
    return this.getPriority().score;
  }

  /**
   * 获取优先级等�?
   */
  public getPriorityLevel(): PriorityLevel {
    return this.getPriority().level;
  }

  // ===== 依赖管理方法 (ONE_TIME) =====

  /**
   * 标记为被阻塞
   */
  public markAsBlocked(reason: string, dependencyTaskUuid?: string): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError(
        'Only ONE_TIME tasks can be blocked by dependencies',
        {
          templateUuid: this.uuid,
          currentStatus: this._status,
          attemptedAction: 'markAsBlocked',
        },
      );
    }
    this._isBlocked = true;
    this._blockingReason = reason;
    this._dependencyStatus = 'BLOCKED';
    this._updatedAt = Date.now();
    this.addHistory('marked_as_blocked', { reason, dependencyTaskUuid });
  }

  /**
   * 标记为就�?(解除依赖阻塞)
   */
  public markAsReady(): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have dependency status', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'markAsReady',
      });
    }
    this._isBlocked = false;
    this._blockingReason = null;
    this._dependencyStatus = 'READY';
    this._updatedAt = Date.now();
    this.addHistory('marked_as_ready');
  }

  /**
   * 更新依赖状�?
   */
  public updateDependencyStatus(status: 'PENDING' | 'READY' | 'BLOCKED'): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have dependency status', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'updateDependencyStatus',
      });
    }
    const oldStatus = this._dependencyStatus;
    this._dependencyStatus = status;
    this._updatedAt = Date.now();
    this.addHistory('dependency_status_updated', { oldStatus, newStatus: status });
  }

  // ===== 历史记录方法 =====

  /**
   * 添加历史记录
   */
  public addHistory(action: string, changes?: any): void {
    const history = TaskTemplateHistory.create({
      templateUuid: this.uuid,
      action,
      changes: changes ? JSON.stringify(changes) : null,
    });
    this._history.push(history);
    this._updatedAt = Date.now();
  }

  // ===== 子实体管理方�?=====

  /**
   * 创建实例
   */
  public createInstance(params: any): string {
    // Check if template is archived or deleted
    if (this._status === 'ARCHIVED') {
      throw new TaskTemplateArchivedError(this.uuid);
    }
    if (this._status === 'DELETED') {
      throw new InvalidTaskTemplateStateError('Cannot create instance from deleted template', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'createInstance',
      });
    }

    // Validate instance date
    if (!params.instanceDate || typeof params.instanceDate !== 'number') {
      throw new InvalidTaskTemplateStateError('Invalid instance date provided', {
        templateUuid: this.uuid,
        currentStatus: this._status,
        attemptedAction: 'createInstance',
      });
    }

    if (!this._timeConfig) {
      throw new Error('Cannot create instance without timeConfig');
    }

    const instance = TaskInstance.create({
      templateUuid: this.uuid,
      accountUuid: this._accountUuid,
      instanceDate: params.instanceDate,
      timeConfig: this._timeConfig,
      importance: this._importance,
    });
    this._instances.push(instance);
    this._updatedAt = Date.now();
    return instance.uuid;
  }

  /**
   * 添加实例
   */
  public addInstance(instance: TaskInstance): void {
    this._instances.push(instance);
    this._updatedAt = Date.now();
  }

  /**
   * 移除实例
   */
  public removeInstance(instanceUuid: string): TaskInstance | null {
    const index = this._instances.findIndex((i) => i.uuid === instanceUuid);
    if (index === -1) return null;
    const [removed] = this._instances.splice(index, 1);
    this._updatedAt = Date.now();
    return removed;
  }

  /**
   * 获取实例
   */
  public getInstance(instanceUuid: string): TaskInstance | null {
    return this._instances.find((i) => i.uuid === instanceUuid) ?? null;
  }

  /**
   * 获取所有实�?
   */
  public getAllInstances(): TaskInstance[] {
    return [...this._instances];
  }

  // ===== DTO 转换 =====

  public toServerDTO(includeChildren: boolean = false): TaskTemplateServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      taskType: this._taskType,
      timeConfig: this._timeConfig?.toServerDTO() ?? null,
      recurrenceRule: this._recurrenceRule?.toServerDTO() ?? null,
      reminderConfig: this._reminderConfig?.toServerDTO() ?? null,
      importance: this._importance,
      goalBinding: this._goalBinding?.toServerDTO() ?? null,
      folderUuid: this._folderUuid,
      tags: [...this._tags],
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate,
      generateAheadDays: this._generateAheadDays,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      // ONE_TIME 任务新字�?
      goalUuid: this._goalUuid,
      keyResultUuid: this._keyResultUuid,
      parentTaskUuid: this._parentTaskUuid,
      startDate: this._startDate,
      dueDate: this._dueDate,
      completedAt: this._completedAt,
      estimatedMinutes: this._estimatedMinutes,
      actualMinutes: this._actualMinutes,
      note: this._note,
      dependencyStatus: this._dependencyStatus,
      isBlocked: this._isBlocked,
      blockingReason: this._blockingReason,
      history: includeChildren ? this._history.map((h) => h.toServerDTO()) : undefined,
      instances: includeChildren ? this._instances.map((i) => i.toServerDTO()) : undefined,
    };
  }

  public toClientDTO(includeChildren: boolean = false): TaskTemplateClientDTO {
    const completedCount = this._instances.filter((i) => i.status === 'COMPLETED').length;
    const pendingCount = this._instances.filter((i) => i.status === 'PENDING').length;
    const totalCount = this._instances.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // ONE_TIME 任务的优先级计算
    const priority = this._taskType === 'ONE_TIME' ? this.getPriority() : null;

    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      taskType: this._taskType,
      timeConfig: this._timeConfig?.toClientDTO() ?? null,
      recurrenceRule: this._recurrenceRule?.toClientDTO() ?? null,
      reminderConfig: this._reminderConfig?.toClientDTO() ?? null,
      importance: this._importance,
      goalBinding: this._goalBinding?.toClientDTO() ?? null,
      folderUuid: this._folderUuid,
      tags: [...this._tags],
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate,
      generateAheadDays: this._generateAheadDays,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      // ONE_TIME 任务新字�?
      goalUuid: this._goalUuid,
      keyResultUuid: this._keyResultUuid,
      parentTaskUuid: this._parentTaskUuid,
      startDate: this._startDate,
      dueDate: this._dueDate,
      completedAt: this._completedAt,
      estimatedMinutes: this._estimatedMinutes,
      actualMinutes: this._actualMinutes,
      note: this._note,
      dependencyStatus: this._dependencyStatus,
      isBlocked: this._isBlocked,
      blockingReason: this._blockingReason,
      history: includeChildren ? this._history.map((h) => h.toClientDTO()) : undefined,
      instances: includeChildren ? this._instances.map((i) => i.toClientDTO()) : undefined,
      displayTitle: this._title,
      taskTypeText: this.getTaskTypeText(),
      timeDisplayText: this._timeConfig?.toClientDTO()?.displayText ?? null,
      recurrenceText: this._recurrenceRule?.toClientDTO().recurrenceDisplayText ?? null,
      importanceText: this.getImportanceText(),
      statusText: this.getStatusText(),
      hasReminder: this.hasReminder(),
      reminderText: this._reminderConfig?.toClientDTO().reminderSummary ?? null,
      isLinkedToGoal: this.isLinkedToGoal(),
      goalLinkText: this._goalBinding?.toClientDTO().displayText ?? null,
      instanceCount: totalCount,
      completedInstanceCount: completedCount,
      pendingInstanceCount: pendingCount,
      completionRate,
      formattedCreatedAt: new Date(this._createdAt).toLocaleString('zh-CN'),
      formattedUpdatedAt: new Date(this._updatedAt).toLocaleString('zh-CN'),
      // ONE_TIME 任务额外的展示字�?
      priorityLevel: priority?.level ?? null,
      priorityScore: priority?.score ?? null,
      isOverdue: this._taskType === 'ONE_TIME' ? this.isOverdue() : null,
      daysUntilDue: this._taskType === 'ONE_TIME' ? this.getDaysUntilDue() : null,
    };
  }

  public toPersistenceDTO(): TaskTemplatePersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      taskType: this._taskType,

      // Flattened timeConfig (RECURRING 任务专用)
      timeConfigType: this._timeConfig?.timeType as 'POINT' | 'RANGE' | 'ALL_DAY' | undefined,
      timeConfigStartTime: this._timeConfig?.startDate,
      timeConfigEndTime: null, // endDate 已移�?- 结束日期属于重复规则
      timeConfigDurationMinutes:
        this._timeConfig?.timeRange &&
        this._timeConfig.timeRange.end &&
        this._timeConfig.timeRange.start
          ? (this._timeConfig.timeRange.end - this._timeConfig.timeRange.start) / 60000
          : undefined,

      // Flattened recurrence_rule (RECURRING 任务专用)
      recurrenceRuleType: this._recurrenceRule?.frequency,
      recurrenceRuleInterval: this._recurrenceRule?.interval,
      recurrenceRuleDaysOfWeek: this._recurrenceRule?.daysOfWeek
        ? JSON.stringify(this._recurrenceRule.daysOfWeek)
        : undefined,
      recurrenceRuleDayOfMonth: undefined, // Not implemented in VO
      recurrenceRuleMonthOfYear: undefined, // Not implemented in VO
      recurrenceRuleEndDate: this._recurrenceRule?.endDate,
      recurrenceRuleCount: this._recurrenceRule?.occurrences,

      // Flattened reminderConfig (RECURRING 任务专用)
      reminderConfigEnabled: this._reminderConfig?.enabled,
      reminderConfigTimeOffsetMinutes: this._reminderConfig?.triggers[0]?.relativeValue,
      reminderConfigUnit: this._reminderConfig?.triggers[0]?.relativeUnit,
      reminderConfigChannel: this._reminderConfig ? 'PUSH' : undefined,

      importance: this._importance, // Store as string: 'vital', 'important', etc.
      // Flattened goal_binding (RECURRING 任务专用 - 旧版�?
      goalBindingGoalUuid: this._goalBinding?.goalUuid,
      goalBindingKeyResultUuid: this._goalBinding?.keyResultUuid,
      goalBindingIncrementValue: this._goalBinding?.incrementValue,

      folderUuid: this._folderUuid,
      tags: JSON.stringify(this._tags),
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate,
      generateAheadDays: this._generateAheadDays ?? null,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,

      // ONE_TIME 任务新字�?
      goalUuid: this._goalUuid,
      keyResultUuid: this._keyResultUuid,
      parentTaskUuid: this._parentTaskUuid,
      startDate: this._startDate,
      dueDate: this._dueDate,
      completedAt: this._completedAt,
      estimatedMinutes: this._estimatedMinutes,
      actualMinutes: this._actualMinutes,
      note: this._note,
      dependencyStatus: this._dependencyStatus,
      isBlocked: this._isBlocked,
      blockingReason: this._blockingReason,
    };
  }

  // ===== 工厂方法 =====

  /**
   * 创建一次性任�?(便捷工厂方法)
   */
  public static createOneTimeTask(params: {
    accountUuid: string;
    title: string;
    description?: string;
    importance?: ImportanceLevel;
    startDate?: number;
    dueDate?: number;
    estimatedMinutes?: number;
    note?: string;
    goalUuid?: string;
    keyResultUuid?: string;
    parentTaskUuid?: string;
    folderUuid?: string;
    tags?: string[];
    color?: string;
  }): TaskTemplate {
    const now = Date.now();
    const template = new TaskTemplate({
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description || null,
      taskType: TaskType.ONE_TIME,
      importance: params.importance ?? ImportanceLevel.Moderate,
      tags: params.tags ?? [],
      color: params.color || null,
      status: TaskTemplateStatus.ACTIVE, // Use ACTIVE instead of TODO
      folderUuid: params.folderUuid || null,
      goalUuid: params.goalUuid || null,
      keyResultUuid: params.keyResultUuid || null,
      parentTaskUuid: params.parentTaskUuid || null,
      startDate: params.startDate || null,
      dueDate: params.dueDate || null,
      estimatedMinutes: params.estimatedMinutes || null,
      note: params.note || null,
      dependencyStatus: 'PENDING',
      isBlocked: false,
      blockingReason: null,
      createdAt: now,
      updatedAt: now,
    });

    template.addHistory('created', { taskType: 'ONE_TIME' });
    return template;
  }

  /**
   * 创建循环任务（便捷工厂方法）
   * 
   * Story 1.1+1.2：已移除 urgency 参数
   * 循环任务的优先级不通过 getPriority() 计算（返回最低优先级）
   */
  public static createRecurringTask(params: {
    accountUuid: string;
    title: string;
    description?: string;
    timeConfig: TaskTimeConfig;
    recurrenceRule: RecurrenceRule;
    reminderConfig?: TaskReminderConfig;
    importance?: ImportanceLevel;
    folderUuid?: string;
    tags?: string[];
    color?: string;
    generateAheadDays?: number;
  }): TaskTemplate {
    const now = Date.now();
    const template = new TaskTemplate({
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description || null,
      taskType: TaskType.RECURRING,
      timeConfig: params.timeConfig,
      recurrenceRule: params.recurrenceRule,
      reminderConfig: params.reminderConfig || null,
      importance: params.importance ?? ImportanceLevel.Moderate,
      goalBinding: null,
      folderUuid: params.folderUuid || null,
      tags: params.tags ?? [],
      color: params.color || null,
      status: TaskTemplateStatus.ACTIVE,
      generateAheadDays: params.generateAheadDays ?? 30,
      createdAt: now,
      updatedAt: now,
    });

    template.addHistory('created', { taskType: 'RECURRING' });
    return template;
  }

  /**
   * 创建新的任务模板（通用工厂方法，保留向后兼容）
   * 
   * 支持一次性任务和循环任务的统一创建接口
   * Story 1.1+1.2：urgency 已移除，优先级改为时间感知的计算
   */
  public static create(params: {
    accountUuid: string;
    title: string;
    description?: string;
    taskType: TaskType;
    timeConfig: TaskTimeConfig;
    recurrenceRule?: RecurrenceRule;
    reminderConfig?: TaskReminderConfig;
    importance?: ImportanceLevel;
    folderUuid?: string;
    tags?: string[];
    color?: string;
    generateAheadDays?: number;
  }): TaskTemplate {
    // Validate required parameters
    if (!params.accountUuid || params.accountUuid.trim().length === 0) {
      throw new InvalidTaskTemplateStateError('Account UUID is required', {
        templateUuid: '',
        currentStatus: 'N/A',
        attemptedAction: 'create',
      });
    }
    if (!params.title || params.title.trim().length === 0) {
      throw new InvalidTaskTemplateStateError('Title is required', {
        templateUuid: '',
        currentStatus: 'N/A',
        attemptedAction: 'create',
      });
    }
    if (!params.timeConfig) {
      throw new InvalidTaskTemplateStateError('Time configuration is required', {
        templateUuid: '',
        currentStatus: 'N/A',
        attemptedAction: 'create',
      });
    }

    const now = Date.now();
    const template = new TaskTemplate({
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      taskType: params.taskType,
      timeConfig: params.timeConfig,
      recurrenceRule: params.recurrenceRule,
      reminderConfig: params.reminderConfig,
      importance: params.importance ?? ImportanceLevel.Moderate,
      goalBinding: null, // Initialize as null
      folderUuid: params.folderUuid,
      tags: params.tags ?? [],
      color: params.color,
      status: 'ACTIVE' as TaskTemplateStatus,
      createdAt: now,
      updatedAt: now,
      generateAheadDays: params.generateAheadDays ?? 30, // Default value
    });

    template.addHistory('created');
    return template;
  }

  /**
   * �?ServerDTO 恢复
   */
  public static fromServerDTO(dto: TaskTemplateServerDTO): TaskTemplate {
    const template = new TaskTemplate(
      {
        accountUuid: dto.accountUuid,
        title: dto.title,
        description: dto.description,
        taskType: dto.taskType,
        timeConfig: dto.timeConfig ? TaskTimeConfig.fromServerDTO(dto.timeConfig) : null,
        recurrenceRule: dto.recurrenceRule
          ? RecurrenceRule.fromServerDTO(dto.recurrenceRule)
          : null,
        reminderConfig: dto.reminderConfig
          ? TaskReminderConfig.fromServerDTO(dto.reminderConfig)
          : null,
        importance: dto.importance,
        goalBinding: dto.goalBinding ? TaskGoalBinding.fromServerDTO(dto.goalBinding) : null,
        folderUuid: dto.folderUuid,
        tags: dto.tags,
        color: dto.color,
        status: dto.status,
        lastGeneratedDate: dto.lastGeneratedDate,
        generateAheadDays: dto.generateAheadDays,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        deletedAt: dto.deletedAt,
        // ONE_TIME 任务新字�?
        goalUuid: dto.goalUuid,
        keyResultUuid: dto.keyResultUuid,
        parentTaskUuid: dto.parentTaskUuid,
        startDate: dto.startDate,
        dueDate: dto.dueDate,
        completedAt: dto.completedAt,
        estimatedMinutes: dto.estimatedMinutes,
        actualMinutes: dto.actualMinutes,
        note: dto.note,
        dependencyStatus: dto.dependencyStatus,
        isBlocked: dto.isBlocked,
        blockingReason: dto.blockingReason,
      },
      dto.uuid,
    );

    // 恢复历史记录
    if (dto.history) {
      template._history = dto.history.map((h) => TaskTemplateHistory.fromServerDTO(h));
    }

    // 恢复实例
    if (dto.instances) {
      template._instances = dto.instances.map((i) => TaskInstance.fromServerDTO(i));
    }

    return template;
  }

  /**
   * �?PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: TaskTemplatePersistenceDTO): TaskTemplate {
    const timeConfig = new TaskTimeConfig({
      timeType: dto.timeConfigType as TimeType,
      startDate: dto.timeConfigStartTime,
      // endDate 已移�?- 结束日期属于重复规则，不属于时间配置
    });

    let recurrenceRule = null;
    if (dto.recurrenceRuleType) {
      recurrenceRule = new RecurrenceRule({
        frequency: dto.recurrenceRuleType as RecurrenceFrequency,
        interval: dto.recurrenceRuleInterval ?? 1,
        daysOfWeek: dto.recurrenceRuleDaysOfWeek ? JSON.parse(dto.recurrenceRuleDaysOfWeek) : [],
        endDate: dto.recurrenceRuleEndDate,
        occurrences: dto.recurrenceRuleCount,
      });
    }

    let reminderConfig = null;
    if (dto.reminderConfigEnabled) {
      const triggers = [
        {
          type: 'RELATIVE',
          relativeValue: dto.reminderConfigTimeOffsetMinutes,
          relativeUnit: dto.reminderConfigUnit,
        },
      ];
      reminderConfig = new TaskReminderConfig({
        enabled: dto.reminderConfigEnabled,
        triggers: triggers as any, // Cast to any to avoid type issues
      });
    }

    let goalBinding = null;
    if (dto.goalBindingGoalUuid) {
      goalBinding = new TaskGoalBinding({
        goalUuid: dto.goalBindingGoalUuid,
        keyResultUuid: dto.goalBindingKeyResultUuid ?? '',
        incrementValue: dto.goalBindingIncrementValue ?? 0,
      });
    }

    const tags = dto.tags ? JSON.parse(dto.tags) : [];

    const props: TaskTemplateProps = {
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      taskType: dto.taskType as TaskType,
      timeConfig,
      recurrenceRule,
      reminderConfig,
      importance: dto.importance as ImportanceLevel, // Now stored as string
      goalBinding,
      folderUuid: dto.folderUuid,
      tags,
      color: dto.color,
      status: dto.status as TaskTemplateStatus,
      lastGeneratedDate: dto.lastGeneratedDate,
      generateAheadDays: dto.generateAheadDays,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
      // ONE_TIME 任务新字�?
      goalUuid: dto.goalUuid,
      keyResultUuid: dto.keyResultUuid,
      parentTaskUuid: dto.parentTaskUuid,
      startDate: dto.startDate,
      dueDate: dto.dueDate,
      completedAt: dto.completedAt,
      estimatedMinutes: dto.estimatedMinutes,
      actualMinutes: dto.actualMinutes,
      note: dto.note,
      dependencyStatus: dto.dependencyStatus,
      isBlocked: dto.isBlocked,
      blockingReason: dto.blockingReason,
    };
    return new TaskTemplate(props, dto.uuid);
  }

  // ===== 辅助方法 =====

  private getTaskTypeText(): string {
    const map: Record<TaskType, string> = {
      ONE_TIME: '单次任务',
      RECURRING: '重复任务',
    };
    return map[this._taskType];
  }

  private getImportanceText(): string {
    const map: Record<ImportanceLevel, string> = {
      [ImportanceLevel.Vital]: '极其重要',
      [ImportanceLevel.Important]: '非常重要',
      [ImportanceLevel.Moderate]: '中等重要',
      [ImportanceLevel.Minor]: '不太重要',
      [ImportanceLevel.Trivial]: '无关紧要',
    };
    return map[this._importance];
  }

  private getStatusText(): string {
    const map: Record<TaskTemplateStatus, string> = {
      ACTIVE: '活跃',
      PAUSED: '暂停',
      ARCHIVED: '归档',
      DELETED: '已删除',
    };
    return map[this._status];
  }
}

interface TaskTemplateProps {
  // === 通用属�?===
  accountUuid: string;
  title: string;
  description?: string | null;
  taskType: TaskType; // 'ONE_TIME' | 'RECURRING'
  importance: ImportanceLevel;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  folderUuid?: string | null;

  // === Goal/KR 关联 ===
  goalUuid?: string | null;
  keyResultUuid?: string | null;
  goalBinding?: TaskGoalBinding | null;

  // === 子任务支�?===
  parentTaskUuid?: string | null;

  // === 循环任务专用 ===
  timeConfig?: TaskTimeConfig | null;
  recurrenceRule?: RecurrenceRule | null;
  reminderConfig?: TaskReminderConfig | null;
  lastGeneratedDate?: number | null;
  generateAheadDays?: number | null;

  // === 一次性任务专�?===
  startDate?: number | null;
  dueDate?: number | null;
  completedAt?: number | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  note?: string | null;

  // === 依赖关系 ===
  dependencyStatus?: string;
  isBlocked?: boolean;
  blockingReason?: string | null;

  // === 审计字段 ===
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}




