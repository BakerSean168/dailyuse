/**
 * TaskTemplate aggregate (Server)
 */

import type {
  TaskTemplateClientDTO,
  TaskTemplatePersistenceDTO,
  TaskTemplateServer,
  TaskTemplateServerDTO,
  TaskEventMap,
} from '@dailyuse/contracts/task';
import { RecurrenceFrequency, RecurrenceEndConditionType, TaskTimeType as TimeType, TaskInstanceStatus } from '@dailyuse/contracts/task';
import { ImportanceLevel, PriorityLevel } from '@dailyuse/contracts/shared';
import { TaskTemplateStatus, TaskTemplateId, TaskFolderId } from '@dailyuse/domain-shared/task';
import { IdentityId, GoalId, KeyResultId } from '@dailyuse/domain-shared';

// TaskType is a simple string literal type, not exported from domain-shared
type TaskType = 'ONE_TIME' | 'RECURRING';
const TaskType = {
  ONE_TIME: 'ONE_TIME' as const,
  RECURRING: 'RECURRING' as const,
};
import { AggregateRoot } from '@dailyuse/utils';
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
 * TaskTemplate �ۺ�??
 *
 * DDD �ۺϸ�ְ��
 * - ��������ģ���������??
 * - ��������ʵ������??
 * - ������ʷ��¼
 * - ִ��ҵ�����?
 * - �������??
 */
export class TaskTemplate extends AggregateRoot<TaskTemplateId> implements TaskTemplateServer {
  // ===== ͨ���ֶ� =====
  private _identityId: IdentityId;
  private _title: string;
  private _description: string | null;
  private _taskType: TaskType; // 'ONE_TIME' | 'RECURRING'
  private _importance: ImportanceLevel;
  private _tags: string[];
  private _color: string | null;
  private _status: TaskTemplateStatus;
  private _folderId: TaskFolderId | null;

  // ===== Goal/KR ������ͨ�ã�=====
  private _goalId: GoalId | null;
  private _keyResultId: KeyResultId | null;
  private _goalBinding: TaskGoalBinding | null; // ��ѭ������ĸ߼���?

  // ===== ������֧�֣�ͨ�ã�=====
  private _parentTaskId: TaskTemplateId | null;

  // ===== ѭ������ר���ֶ� =====
  private _timeConfig: TaskTimeConfig | null;
  private _recurrenceRule: RecurrenceRule | null;
  private _reminderConfig: TaskReminderConfig | null;
  private _lastGeneratedDate: Date | null;
  private _generateAheadDays: number | null;

  // ===== Checklist =====
  private _checklist: ChecklistItemDefinition[];

  // ===== һ��������ר����??=====
  private _startDate: Date | null;
  private _dueDate: Date | null;
  private _completedAt: Date | null;
  private _estimatedMinutes: number | null;
  private _actualMinutes: number | null;
  private _note: string | null;

  // ===== ������ϵ��ͨ��??=====
  private _dependencyStatus: string; // 'NONE' | 'WAITING' | 'READY' | 'BLOCKED'
  private _isBlocked: boolean;
  private _blockingReason: string | null;

  // ===== ����ֶ�?=====
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;
  private _version: number;

  // ===== ��ʵ�弯??=====
  private _history: TaskTemplateHistory[];
  private _instances: TaskInstance[]; // ??RECURRING ʹ��

  // ===== ���캯����˽�У�ͨ����������������=====
  private constructor(props: TaskTemplateProps, id?: TaskTemplateId) {
    super(id || TaskTemplateId.generate());

    // ͨ���ֶ�
    this._identityId = props.identityId;
    this._title = props.title;
    this._description = props.description ?? null;
    this._taskType = props.taskType;
    this._importance = props.importance;
    this._tags = props.tags;
    this._color = props.color ?? null;
    this._status = props.status;
    this._folderId = props.folderId ?? null;

    // Goal/KR ����
    this._goalId = props.goalId ?? null;
    this._keyResultId = props.keyResultId ?? null;
    this._goalBinding = props.goalBinding ?? null;

    // ������֧��
    this._parentTaskId = props.parentTaskId ?? null;

    // ѭ������ר��
    this._timeConfig = props.timeConfig ?? null;
    this._recurrenceRule = props.recurrenceRule ?? null;
    this._reminderConfig = props.reminderConfig ?? null;
    this._lastGeneratedDate = props.lastGeneratedDate ?? null;
    this._generateAheadDays = props.generateAheadDays ?? null;

    // Checklist
    this._checklist = props.checklist ?? [];

    // һ��������ר??
    this._startDate = props.startDate ?? null;
    this._dueDate = props.dueDate ?? null;
    this._completedAt = props.completedAt ?? null;
    this._estimatedMinutes = props.estimatedMinutes ?? null;
    this._actualMinutes = props.actualMinutes ?? null;
    this._note = props.note ?? null;

    // ������ϵ
    this._dependencyStatus = props.dependencyStatus ?? 'NONE';
    this._isBlocked = props.isBlocked ?? false;
    this._blockingReason = props.blockingReason ?? null;

    // ����ֶ�?
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt ?? null;
    this._version = props.version ?? 1;

    // ��ʵ??
    this._history = [];
    this._instances = [];
  }

  // ===== Getter ���� =====

  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get name(): string {
    return this._title;
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

  public get folderId(): TaskFolderId | null {
    return this._folderId;
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

  public get lastGeneratedDate(): Date | null {
    return this._lastGeneratedDate;
  }

  public get generateAheadDays(): number | null {
    return this._generateAheadDays;
  }

  public get checklist(): ChecklistItemDefinition[] {
    return [...this._checklist];
  }

  // === ���� Getter��һ���������ͨ��??===

  public get goalId(): GoalId | null {
    return this._goalId;
  }

  public get keyResultId(): KeyResultId | null {
    return this._keyResultId;
  }

  public get parentTaskId(): TaskTemplateId | null {
    return this._parentTaskId;
  }

  public get startDate(): Date | null {
    return this._startDate;
  }

  public get dueDate(): Date | null {
    return this._dueDate;
  }

  public get completedAt(): Date | null {
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

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  public get version(): number {
    return this._version;
  }

  public get history(): TaskTemplateHistory[] {
    return this._history;
  }

  public get instances(): TaskInstance[] {
    return [...this._instances];
  }

  // ===== ʵ�����ɷ��� =====

  /**
   * ����ָ�����ڷ�Χ�ڵ�����ʵ��
   */
  public generateInstances(fromDate: number, toDate: number): TaskInstance[] {
    // Validate date range
    if (fromDate >= toDate) {
      throw new InvalidDateRangeError(fromDate, toDate);
    }

    // Check if template is archived
    if (this._status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }

    const instances: TaskInstance[] = [];

    // Only generate instances for active templates
    if (this._status !== TaskTemplateStatus.Active) {
      throw new InvalidTaskTemplateStateError('Can only generate instances for active templates', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'generateInstances',
      });
    }

    if (this._taskType === TaskType.ONE_TIME) {
      // ��������ֻҪ�� startDate ������ʵ�������������ڷ�Χ��
      // ԭ�򣺵������������δ����Զ�����ڣ��û���Ȼ��Ҫ��??
      if (this._timeConfig?.startDate) {
        // ����Ƿ��Ѿ����ɹ��������ظ����ɣ�?
        const alreadyGenerated = this._instances.some(
          (inst) => inst.instanceDate === this._timeConfig!.startDate?.getTime(),
        );

        if (!alreadyGenerated) {
          const instance = TaskInstance.create({
            templateId: this.id,
            identityId: this._identityId,
            instanceDate: this._timeConfig.startDate.getTime(),
            timeConfig: this._timeConfig,
            importance: this._importance,
          });
          instances.push(instance);
          this._instances.push(instance);
        }
      }
    } else if (this._taskType === TaskType.RECURRING && this._recurrenceRule && this._timeConfig) {
      // �ظ����񣺸����ظ��������ɶ��ʵ�������������ڷ�Χ��??
      let currentDate = fromDate;
      while (currentDate <= toDate) {
        if (this.shouldGenerateInstance(currentDate)) {
          const instance = TaskInstance.create({
            templateId: this.id,
            identityId: this._identityId,
            instanceDate: currentDate,
            timeConfig: this._timeConfig,
            importance: this._importance,
          });
          instances.push(instance);
          this._instances.push(instance);
        }
        // �ƶ�����һ??
        currentDate += 86400000;
      }
    }

    if (instances.length > 0) {
      this._lastGeneratedDate = new Date(toDate);
      this._updatedAt = new Date();
    }

    return instances;
  }

  /**
   * ��ȡָ�����ڵ�����ʵ??
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
   * �ж��Ƿ�Ӧ����ָ����������ʵ??
   */
  public shouldGenerateInstance(date: number): boolean {
    if (this._status !== TaskTemplateStatus.Active) {
      return false;
    }

    if (this._taskType === 'ONE_TIME') {
      return false; // ���������ڴ���??
    }

    if (!this._recurrenceRule) {
      return false;
    }

    // ����Ƿ����ظ��������Ч��??
    if (this._recurrenceRule.endDate && date > this._recurrenceRule.endDate.getTime()) {
      return false;
    }

    // ����??
    const rule = this._recurrenceRule;
    const dateObj = new Date(date);

    switch (rule.frequency) {
      case RecurrenceFrequency.Daily:
        return true; // ÿ�춼��??

      case RecurrenceFrequency.Weekly:
        // ����Ƿ���ָ�������ڼ�?
        const dayOfWeek = dateObj.getDay();
        return rule.daysOfWeek.includes(dayOfWeek as any);

      case RecurrenceFrequency.Monthly:
        // ÿ�µ�ָ����??
        // ����򻯴�����ʵ��Ӧ�ø���??
        return true;

      case RecurrenceFrequency.Yearly:
        // ÿ���ָ����??
        return true;

      default:
        return false;
    }
  }

  // ===== ״̬������??=====

  /**
   * ����ģ??
   */
  public activate(): void {
    if (this._status === TaskTemplateStatus.Deleted) {
      throw new InvalidTaskTemplateStateError('Cannot activate a deleted template', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'activate',
      });
    }
    if (this._status === TaskTemplateStatus.Active) {
      throw new InvalidTaskTemplateStateError('Template is already active', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'activate',
      });
    }
    this._status = TaskTemplateStatus.Active;
    this._updatedAt = new Date();
    this.addHistory('resumed');
  }

  /**
   * ��ͣģ��
   */
  public pause(): void {
    if (this._status !== TaskTemplateStatus.Active) {
      throw new InvalidTaskTemplateStateError('Can only pause active templates', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'pause',
      });
    }
    this._status = TaskTemplateStatus.Paused;
    this._updatedAt = new Date();
    this.addHistory('Paused');
  }

  /**
   * �鵵ģ��
   */
  public archive(): void {
    if (this._status === TaskTemplateStatus.Deleted) {
      throw new InvalidTaskTemplateStateError('Cannot archive a deleted template', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'archive',
      });
    }
    if (this._status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }
    this._status = TaskTemplateStatus.Archived;
    this._updatedAt = new Date();
    this.addHistory('Archived');
  }

  /**
   * ��ɾ��ģ??
   */
  public softDelete(): void {
    if (this._status === TaskTemplateStatus.Deleted) {
      throw new InvalidTaskTemplateStateError('Template is already deleted', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'softDelete',
      });
    }
    this._status = TaskTemplateStatus.Deleted;
    this._deletedAt = new Date();
    this._updatedAt = new Date();
    this.addHistory('Deleted');
    
    // ?? ���������¼�
    this.addDomainEvent<TaskEventMap['task:delete']>('task:delete', {
      isSoftDelete: true,
    });
  }

  /**
   * �ָ�ģ��
   */
  public restore(): void {
    if (this._status !== TaskTemplateStatus.Deleted) {
      throw new InvalidTaskTemplateStateError('Can only restore deleted templates', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'restore',
      });
    }
    this._status = TaskTemplateStatus.Active;
    this._deletedAt = null;
    this._updatedAt = new Date();
    this.addHistory('restored');
  }

  // ===== һ��������״̬������??=====
  // NOTE: ��Щ�����ѷ����������¼ܹ�����������ҲӦ��ͨ�� TaskInstance ������״̬??
  // TaskTemplate ֻ����ģ�������ACTIVE/PAUSED/ARCHIVED/DELETED��??
  // ������Щ����ֻ��Ϊ�������ݣ�δ��Ӧ���Ƴ�??

  // ===== ʱ����򷽷�?=====

  /**
   * �ж�ģ����ָ�������Ƿ��??
   */
  public isActiveOnDate(date: number): boolean {
    if (this._status !== TaskTemplateStatus.Active) {
      return false;
    }

    if (this._taskType === TaskType.ONE_TIME) {
      return this._timeConfig?.startDate?.getTime() === date;
    }

    if (!this._recurrenceRule) {
      return false;
    }

    if (this._recurrenceRule.endDate && date > this._recurrenceRule.endDate.getTime()) {
      return false;
    }

    return true;
  }

  /**
   * ��ȡָ������֮�����һ�η����??
   */
  public getNextOccurrence(afterDate: number): number | null {
    if (this._status !== TaskTemplateStatus.Active) {
      return null;
    }

    if (this._taskType === TaskType.ONE_TIME) {
      if (this._timeConfig?.startDate && this._timeConfig.startDate.getTime() > afterDate) {
        return this._timeConfig.startDate.getTime();
      }
      return null;
    }

    if (!this._recurrenceRule) {
      return null;
    }

    // ��ʵ�֣�������һ�죨ʵ��Ӧ�ø����ظ��������??
    return afterDate + 86400000;
  }

  // ===== һ��������ʱ�������??=====

  /**
   * ���±���
   */
  public updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new InvalidTaskTemplateStateError('Title cannot be empty', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'updateTitle',
      });
    }
    const oldTitle = this._title;
    this._title = newTitle.trim();
    this._updatedAt = new Date();
    this.addHistory('title_updated', { oldTitle, newTitle: this._title });
    
    // ?? ���������¼�
    this.addDomainEvent<TaskEventMap['task:update']>('task:update', {
      changes: ['title'],
    });
  }

  /**
   * ��������
   */
  public updateDescription(newDescription: string | null): void {
    const oldDescription = this._description;
    this._description = newDescription ? newDescription.trim() : null;
    this._updatedAt = new Date();
    this.addHistory('description_updated', { oldDescription, newDescription: this._description });
  }

  /**
   * ���¿�ʼʱ??(ONE_TIME)
   */
  public updateStartDate(newStartDate: Date | null): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have start dates', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'updateStartDate',
      });
    }
    const oldStartDate = this._startDate;
    this._startDate = newStartDate;
    this._updatedAt = new Date();
    this.addHistory('start_date_updated', { oldStartDate, newStartDate });

    this.addDomainEvent('task_template.schedule_time_changed', {
      taskTemplate: this.toServerDTO(),
      oldStartDate: oldStartDate,
      oldDueDate: this._dueDate,
      newStartDate: newStartDate,
      newDueDate: this._dueDate,
    });
  }

  /**
   * ���½�ֹʱ�� (ONE_TIME)
   */
  public updateDueDate(newDueDate: Date | null): void {
    if (this._taskType !== TaskType.ONE_TIME) {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have due dates', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'updateDueDate',
      });
    }
    // Note: TaskTemplateStatus doesn't have COMPLETED/CANCELLED states
    // Those are TaskInstanceStatus states. This check has been removed.
    const oldDueDate = this._dueDate;
    this._dueDate = newDueDate;
    this._updatedAt = new Date();
    this.addHistory('due_date_updated', { oldDueDate, newDueDate });

    this.addDomainEvent('task_template.schedule_time_changed', {
      taskTemplate: this.toServerDTO(),
      oldStartDate: this._startDate,
      oldDueDate: oldDueDate,
      newStartDate: this._startDate,
      newDueDate: newDueDate,
    });
  }

  /**
   * �����ظ����� (RECURRING)
   */
  public updateRecurrenceRule(newRule: RecurrenceRule): void {
    if (this._taskType !== 'RECURRING') {
      throw new InvalidTaskTemplateStateError('Only RECURRING tasks have recurrence rules.', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'updateRecurrenceRule',
      });
    }
    const oldRuleDTO = this._recurrenceRule?.toDTO() ?? null;
    this._recurrenceRule = newRule;
    this._updatedAt = new Date();
    this.addHistory('recurrence_rule_updated', {
      oldRule: oldRuleDTO,
      newRule: newRule.toDTO(),
    });

    this.addDomainEvent('task_template.recurrence_changed', {
      taskTemplate: this.toServerDTO(),
      oldRecurrenceRule: oldRuleDTO,
      newRecurrenceRule: newRule.toDTO(),
    });
  }

  /**
   * �����ظ�����Ľ���������ʹ��ö�����ͺ�Ĭ��ֵ��?
   * @param endConditionType ������������
   * @param customValue �Զ���ֵ������ʱ������ظ�����??
   */
  public updateRecurrenceEndCondition(
    endConditionType: RecurrenceEndConditionType,
    customValue?: number,
  ): void {
    if (this._taskType !== TaskType.RECURRING) {
      throw new InvalidTaskTemplateStateError('Only RECURRING tasks have recurrence rules.', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'updateRecurrenceEndCondition',
      });
    }

    if (!this._recurrenceRule) {
      throw new InvalidTaskTemplateStateError('Recurrence rule is not set', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'updateRecurrenceEndCondition',
      });
    }

    let updatedRule: RecurrenceRule;

    switch (endConditionType) {
      case RecurrenceEndConditionType.Never:
        // ������������??endDate ??occurrences
        updatedRule = this._recurrenceRule.setEndDate(null).setOccurrences(null);
        break;

      case RecurrenceEndConditionType.EndDate:
        // ָ�����ڽ�����ʹ���ṩ�����ڣ����û����Ĭ��??30 ���?
        const endDate = customValue ?? Date.now() + 30 * 86400000; // Ĭ�� 30 ���?
        updatedRule = this._recurrenceRule.setEndDate(new Date(endDate));
        break;

      case RecurrenceEndConditionType.Occurrences:
        // ָ������������ʹ���ṩ�Ĵ��������û����Ĭ��??10 ??
        const occurrences = customValue ?? 10; // Ĭ�� 10 ??
        updatedRule = this._recurrenceRule.setOccurrences(occurrences);
        break;

      default:
        throw new InvalidTaskTemplateStateError(`Invalid end condition type: ${endConditionType}`, {
          templateId: this.id,
          currentStatus: this._status,
          attemptedAction: 'updateRecurrenceEndCondition',
        });
    }

    const oldRuleDTO = this._recurrenceRule.toDTO();
    this._recurrenceRule = updatedRule;
    this._updatedAt = new Date();

    this.addHistory('recurrence_end_condition_updated', {
      oldRule: oldRuleDTO,
      newRule: updatedRule.toDTO(),
      endConditionType,
    });

    this.addDomainEvent('task_template.recurrence_changed', {
      taskTemplate: this.toServerDTO(),
      oldRecurrenceRule: oldRuleDTO,
      newRecurrenceRule: updatedRule.toDTO(),
    });
  }

  /**
   * ��������??
   */
  public updatePriority(newImportance: ImportanceLevel): void {
    const oldImportance = this._importance;
    this._importance = newImportance;
    this._updatedAt = new Date();
    this.addHistory('priority_updated', { oldImportance, newImportance });
  }

  /**
   * ���±�ǩ
   */
  public updateTags(newTags: string[]): void {
    const oldTags = [...this._tags];
    this._tags = [...new Set(newTags)]; // ȥ��
    this._updatedAt = new Date();
    this.addHistory('tags_updated', { oldTags, newTags: this._tags });
  }

  /**
   * ������ɫ
   */
  public updateColor(newColor: string | null): void {
    const oldColor = this._color;
    this._color = newColor;
    this._updatedAt = new Date();
    this.addHistory('color_updated', { oldColor, newColor });
  }

  /**
   * ���±�ע (ONE_TIME)
   */
  public updateNote(newNote: string | null): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have notes', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'updateNote',
      });
    }
    const oldNote = this._note;
    this._note = newNote;
    this._updatedAt = new Date();
    this.addHistory('note_updated', { oldNote, newNote });
  }

  /**
   * ����Ԥ��ʱ�� (ONE_TIME)
   */
  public updateEstimatedTime(estimatedMinutes: number): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have estimated time', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'updateEstimatedTime',
      });
    }
    if (estimatedMinutes < 0) {
      throw new InvalidTaskTemplateStateError('Estimated time cannot be negative', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'updateEstimatedTime',
      });
    }
    const oldEstimatedMinutes = this._estimatedMinutes;
    this._estimatedMinutes = estimatedMinutes;
    this._updatedAt = new Date();
    this.addHistory('estimated_time_updated', { oldEstimatedMinutes, estimatedMinutes });
  }

  /**
   * �ж��Ƿ����� (ONE_TIME)
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
    return Date.now() > this._dueDate.getTime();
  }

  /**
   * ��ȡ�����ֹ���ڵ���??(ONE_TIME)
   */
  public getDaysUntilDue(): number | null {
    if (this._taskType !== TaskType.ONE_TIME) {
      return null;
    }
    if (!this._dueDate) {
      return null;
    }
    const now = Date.now();
    const diffMs = this._dueDate.getTime() - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // ===== ���ѷ��� =====

  /**
   * �Ƿ�����??
   */
  public hasReminder(): boolean {
    return this._reminderConfig !== null && this._reminderConfig.enabled;
  }

  /**
   * ��ȡָ��ʵ�����ڵ�����ʱ??
   */
  public getReminderTime(instanceDate: number): number | null {
    if (!this.hasReminder() || !this._reminderConfig) {
      return null;
    }

    // ��ʵ�֣�����ʵ������??Сʱ
    // ʵ��Ӧ�ø����������ü���
    return instanceDate - 3600000;
  }

  // ===== Ŀ��󶨷���?=====

  /**
   * �󶨵�Ŀ??
   */
  public bindToGoal(goalId: string, keyResultId: string, goalRecordValue: number): void {
    // Validate parameters
    if (!goalId || !keyResultId) {
      throw new InvalidGoalBindingError('Goal ID and Key Result ID are required');
    }

    // Check if already bound
    if (this._goalBinding) {
      throw new InvalidGoalBindingError('Template is already bound to a goal');
    }

    // Check if template is archived
    if (this._status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }

    this._goalBinding = TaskGoalBinding.fromDTO({
      goalId,
      keyResultId,
      goalRecordValue,
    });
    this._updatedAt = new Date();
    this.addHistory('goal_bound', { goalId, keyResultId, goalRecordValue });
  }

  /**
   * ���Ŀ���
   */
  public unbindFromGoal(): void {
    // Check if template has goal binding
    if (!this._goalBinding) {
      throw new InvalidGoalBindingError('Template is not bound to any goal');
    }

    // Check if template is archived
    if (this._status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }

    this._goalBinding = null;
    this._updatedAt = new Date();
    this.addHistory('goal_unbound');
  }

  /**
   * �Ƿ�󶨵��??
   */
  public isLinkedToGoal(): boolean {
    return this._goalBinding !== null;
  }

  /**
   * �󶨵�Ŀ??(ONE_TIME) - �°汾֧�����ֶ�
   */
  public linkToGoal(goalUuid: string, keyResultUuid?: string): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can be linked to goals', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'linkToGoal',
      });
    }
    if (this._goalId) {
      throw new InvalidTaskTemplateStateError('Task is already linked to a goal', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'linkToGoal',
      });
    }
    this._goalId = goalUuid as GoalId;
    this._keyResultId = (keyResultUuid || null) as KeyResultId | null;
    this._updatedAt = new Date();
    this.addHistory('linked_to_goal', { goalUuid, keyResultUuid });
  }

  /**
   * ���Ŀ������?(ONE_TIME)
   */
  public unlinkFromGoal(): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can be unlinked from goals', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'unlinkFromGoal',
      });
    }
    if (!this._goalId) {
      throw new InvalidTaskTemplateStateError('Task is not linked to any goal', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'unlinkFromGoal',
      });
    }
    const oldGoalUuid = this._goalId;
    const oldKeyResultUuid = this._keyResultId;
    this._goalId = null;
    this._keyResultId = null;
    this._updatedAt = new Date();
    this.addHistory('unlinked_from_goal', { oldGoalUuid, oldKeyResultUuid });
  }

  // ===== �����������??(ONE_TIME) =====

  /**
   * ��������??
   */
  public addSubtask(subtaskUuid: string): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have subtasks', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'addSubtask',
      });
    }
    // ʵ��ʵ����Ӧ��ͨ�� repository ��֤ subtaskUuid �Ƿ����?
    this._updatedAt = new Date();
    this.addHistory('subtask_added', { subtaskUuid });
  }

  /**
   * �Ƴ�����??
   */
  public removeSubtask(subtaskUuid: string): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have subtasks', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'removeSubtask',
      });
    }
    this._updatedAt = new Date();
    this.addHistory('subtask_removed', { subtaskUuid });
  }

  /**
   * �ж��Ƿ���������
   */
  public isSubtask(): boolean {
    return this._parentTaskId !== null;
  }

  /**
   * ��ȡ������UUID
   */
  public getParentTaskUuid(): string | null {
    return this._parentTaskId;
  }

  // ===== ���ȼ����㷽??(ONE_TIME) =====

  /**
   * ��ȡ���ȼ��ȼ��ͷ��� (Story 1.2)
   *
   * ʹ�ô����� calculateTaskPriority �������ȼ����������ڣ�
   * - Importance����Ҫ�ԣ���Task ʵ���������?
   * - Due Date����ֹ���ڣ������ڼ���ʱ������̶�?
   * - Current Time����ǰʱ�䣩����׼ʱ���?
   *
   * ����һ�������񣺸��ݷ���ӳ�䵽 5 �����ȼ��ȼ�
   * ����ѭ�����񣺷���������ȼ�?
   */
  public getPriority(): { level: PriorityLevel; score: number } {
    if (this._taskType !== TaskType.ONE_TIME) {
      return { level: PriorityLevel.Low as PriorityLevel, score: 0 };
    }

    const currentTime = new Date();
    const dueDateObj = this._dueDate;

    const score = calculateTaskPriority(this._importance, dueDateObj, currentTime);
    const level = this.scoreToPriorityLevel(score);

    return { level, score };
  }

  /**
   * �����ȼ�����ӳ�䵽���ȼ��ȼ�
   *
   * ������Χ��[0, 100]
   * - [80, 100]: Critical��������- ��Ҫ��������
   * - [60, 80): High���ߣ�- ������봦��?
   * - [40, 60): Medium���У�- ������Ҫ����
   * - [20, 40): Low���ͣ�- �����Ժ���
   * - [0, 20): None���ޣ�- �޾���ʱ��Ҫ��
   */
  private scoreToPriorityLevel(score: number): PriorityLevel {
    if (score >= 80) return PriorityLevel.Critical as PriorityLevel;
    if (score >= 60) return PriorityLevel.High as PriorityLevel;
    if (score >= 40) return PriorityLevel.Medium as PriorityLevel;
    if (score >= 20) return PriorityLevel.Low as PriorityLevel;
    return PriorityLevel.None as PriorityLevel;
  }

  /**
   * ��ȡ���ȼ���??
   */
  public getPriorityScore(): number {
    return this.getPriority().score;
  }

  /**
   * ��ȡ���ȼ���??
   */
  public getPriorityLevel(): PriorityLevel {
    return this.getPriority().level;
  }

  // ===== ������������ (ONE_TIME) =====

  /**
   * ���Ϊ������?
   */
  public markAsBlocked(reason: string, dependencyTaskUuid?: string): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError(
        'Only ONE_TIME tasks can be blocked by dependencies',
        {
          templateId: this.id,
          currentStatus: this._status,
          attemptedAction: 'markAsBlocked',
        },
      );
    }
    this._isBlocked = true;
    this._blockingReason = reason;
    this._dependencyStatus = 'BLOCKED';
    this._updatedAt = new Date();
    this.addHistory('marked_as_blocked', { reason, dependencyTaskUuid });
  }

  /**
   * ���Ϊ��??(�����������?
   */
  public markAsReady(): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have dependency status', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'markAsReady',
      });
    }
    this._isBlocked = false;
    this._blockingReason = null;
    this._dependencyStatus = 'READY';
    this._updatedAt = new Date();
    this.addHistory('marked_as_ready');
  }

  /**
   * ��������״??
   */
  public updateDependencyStatus(status: 'Pending' | 'READY' | 'BLOCKED'): void {
    if (this._taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have dependency status', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'updateDependencyStatus',
      });
    }
    const oldStatus = this._dependencyStatus;
    this._dependencyStatus = status;
    this._updatedAt = new Date();
    this.addHistory('dependency_status_updated', { oldStatus, newStatus: status });
  }

  // ===== ��ʷ��¼���� =====

  /**
   * ������ʷ��¼
   */
  public addHistory(action: string, changes?: any): void {
    const history = TaskTemplateHistory.create({
      templateUuid: this.id,
      action,
      changes: changes ? JSON.stringify(changes) : null,
    });
    this._history.push(history);
    this._updatedAt = new Date();
  }

  // ===== ��ʵ�������??=====

  /**
   * ����ʵ��
   */
  public createInstance(params: any): string {
    // Check if template is archived or deleted
    if (this._status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }
    if (this._status === TaskTemplateStatus.Deleted) {
      throw new InvalidTaskTemplateStateError('Cannot create instance from deleted template', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'createInstance',
      });
    }

    // Validate instance date
    if (!params.instanceDate || typeof params.instanceDate !== 'number') {
      throw new InvalidTaskTemplateStateError('Invalid instance date provided', {
        templateId: this.id,
        currentStatus: this._status,
        attemptedAction: 'createInstance',
      });
    }

    if (!this._timeConfig) {
      throw new Error('Cannot create instance without timeConfig');
    }

    const instance = TaskInstance.create({
      templateId: this.id,
      identityId: this._identityId,
      instanceDate: params.instanceDate,
      timeConfig: this._timeConfig,
      importance: this._importance,
    });
    this._instances.push(instance);
    this._updatedAt = new Date();
    return instance.id;
  }

  /**
   * ����ʵ��
   */
  public addInstance(instance: TaskInstance): void {
    this._instances.push(instance);
    this._updatedAt = new Date();
  }

  /**
   * �Ƴ�ʵ��
   */
  public removeInstance(instanceUuid: string): TaskInstance | null {
    const index = this._instances.findIndex((i) => i.id === instanceUuid);
    if (index === -1) return null;
    const [removed] = this._instances.splice(index, 1);
    this._updatedAt = new Date();
    return removed;
  }

  /**
   * ��ȡʵ��
   */
  public getInstance(instanceUuid: string): TaskInstance | null {
    return this._instances.find((i) => i.id === instanceUuid) ?? null;
  }

  /**
   * ��ȡ����ʵ??
   */
  public getAllInstances(): TaskInstance[] {
    return [...this._instances];
  }

  // ===== DTO ת�� =====

  public toServerDTO(includeChildren: boolean = false): TaskTemplateServerDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._title,
      description: this._description,
      timeConfig: this._timeConfig?.toDTO() ?? null,
      recurrenceRule: this._recurrenceRule?.toDTO() ?? null,
      reminderConfig: this._reminderConfig?.toDTO() ?? null,
      importance: this._importance,
      priority: this._taskType === 'ONE_TIME' ? this.getPriority().score : undefined,
      goalBinding: this._goalBinding?.toDTO() ?? null,
      checklist: this._checklist.map((c) => c.toDTO()),
      folderId: this._folderId,
      tags: [...this._tags],
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate?.getTime() ?? null,
      generateAheadDays: this._generateAheadDays,
      parentTaskId: this._parentTaskId,
      dependencyStatus: this._dependencyStatus,
      isBlocked: this._isBlocked,
      blockingReason: this._blockingReason,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      version: this._version,
      instances: includeChildren ? this._instances.map((i) => i.toServerDTO()) : undefined,
    };
  }

  public toClientDTO(includeChildren: boolean = false): TaskTemplateClientDTO {
    const completedCount = this._instances.filter((i) => i.status === 'Completed').length;
    const pendingCount = this._instances.filter((i) => i.status === 'Pending').length;
    const totalCount = this._instances.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // ONE_TIME ��������ȼ�����?
    const priority = this._taskType === 'ONE_TIME' ? this.getPriority() : undefined;

    return {
      id: this.id,
      identityId: this._identityId,
      name: this._title,
      description: this._description,
      timeConfig: this._timeConfig?.toDTO() ?? { timeType: 'AllDay', startDate: null, timePoint: null, timeRange: null },
      recurrenceRule: this._recurrenceRule?.toDTO() ?? null,
      reminderConfig: this._reminderConfig?.toDTO() ?? null,
      importance: this._importance,
      priority: priority?.score,
      goalBinding: this._goalBinding?.toDTO() ?? null,
      folderId: this._folderId,
      tags: [...this._tags],
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate?.getTime() ?? null,
      generateAheadDays: this._generateAheadDays,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      version: this._version,
      parentTaskId: this._parentTaskId,
      startDate: this._startDate?.getTime() ?? null,
      dueDate: this._dueDate?.getTime() ?? null,
      completedAt: this._completedAt?.getTime() ?? null,
      estimatedMinutes: this._estimatedMinutes,
      actualMinutes: this._actualMinutes,
      comment: this._note,
      dependencyStatus: this._dependencyStatus,
      isBlocked: this._isBlocked,
      blockingReason: this._blockingReason,
      history: includeChildren ? this._history.map((h) => h.toClientDTO()) : undefined,
      instances: includeChildren ? this._instances.map((i) => i.toClientDTO()) : undefined,
      instanceCount: totalCount,
      completedInstanceCount: completedCount,
      pendingInstanceCount: pendingCount,
      completionRate,
    };
  }

  public toPersistenceDTO(): TaskTemplatePersistenceDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._title,
      description: this._description,

      // Flattened timeConfig (RECURRING ����ר��)
      timeConfigType: this._timeConfig?.timeType ?? null,
      timeConfigStartTime: this._timeConfig?.startDate ?? null,
      timeConfigEndTime: null, // endDate ���Ƴ� - �������������ظ�����
      timeConfigDurationMinutes:
        this._timeConfig?.timeRange &&
        this._timeConfig.timeRange.end &&
        this._timeConfig.timeRange.start
          ? (this._timeConfig.timeRange.end - this._timeConfig.timeRange.start) / 60000
          : null,

      // Flattened recurrence_rule (RECURRING ����ר��)
      recurrenceRuleType: this._recurrenceRule?.frequency ?? null,
      recurrenceRuleInterval: this._recurrenceRule?.interval ?? null,
      recurrenceRuleDaysOfWeek: this._recurrenceRule?.daysOfWeek
        ? JSON.stringify(this._recurrenceRule.daysOfWeek)
        : null,
      recurrenceRuleDayOfMonth: null, // Not implemented in VO
      recurrenceRuleMonthOfYear: null, // Not implemented in VO
      recurrenceRuleEndDate: this._recurrenceRule?.endDate ?? null,
      recurrenceRuleCount: this._recurrenceRule?.occurrences ?? null,

      // Flattened reminderConfig (RECURRING ����ר��)
      reminderConfigEnabled: this._reminderConfig?.enabled ?? null,
      reminderConfigTimeOffsetMinutes: this._reminderConfig?.triggers[0]?.relativeValue ?? null,
      reminderConfigUnit: this._reminderConfig?.triggers[0]?.relativeUnit ?? null,
      reminderConfigChannel: this._reminderConfig ? 'PUSH' : null,

      importance: this._importance, // Store as string: 'vital', 'important', etc.
      goalBinding: this._goalBinding?.toDTO() ?? null,

      folderId: this._folderId,
      tags: JSON.stringify(this._tags),
      color: this._color,
      status: this._status,
      lastGeneratedDate: this._lastGeneratedDate,
      generateAheadDays: this._generateAheadDays ?? null,
      parentTaskId: this._parentTaskId,
      dependencyStatus: this._dependencyStatus,
      isBlocked: this._isBlocked,
      blockingReason: this._blockingReason,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      version: this._version,
    };
  }

  // ===== �������� =====

  /**
   * ����һ������??(��ݹ�������?
   */
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
    const now = new Date();
    const template = new TaskTemplate({
      identityId: params.identityId,
      title: params.title,
      description: params.description || null,
      taskType: TaskType.ONE_TIME,
      importance: (params.importance ?? ImportanceLevel.Moderate) as ImportanceLevel,
      tags: params.tags ?? [],
      color: params.color || null,
      status: TaskTemplateStatus.Active, // Use ACTIVE instead of TODO
      folderId: params.folderId || null,
      goalId: params.goalId || null,
      keyResultId: params.keyResultId || null,
      parentTaskId: params.parentTaskId || null,
      startDate: params.startDate || null,
      dueDate: params.dueDate || null,
      estimatedMinutes: params.estimatedMinutes || null,
      note: params.note || null,
      dependencyStatus: 'Pending',
      isBlocked: false,
      blockingReason: null,
      createdAt: now,
      updatedAt: now,
    });

    template.addHistory('created', { taskType: 'ONE_TIME' });
    return template;
  }

  /**
   * ����ѭ�����񣨱�ݹ���������?
   *
   * Story 1.1+1.2�����Ƴ� urgency ����
   * ѭ����������ȼ���ͨ��?getPriority() ���㣨����������ȼ���?
   */
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
    const now = new Date();
    const template = new TaskTemplate({
      identityId: params.identityId,
      title: params.title,
      description: params.description || null,
      taskType: TaskType.RECURRING,
      timeConfig: params.timeConfig,
      recurrenceRule: params.recurrenceRule,
      reminderConfig: params.reminderConfig || null,
      importance: (params.importance ?? ImportanceLevel.Moderate) as ImportanceLevel,
      goalBinding: null,
      folderId: params.folderId || null,
      tags: params.tags ?? [],
      color: params.color || null,
      status: TaskTemplateStatus.Active,
      generateAheadDays: params.generateAheadDays ?? 30,
      createdAt: now,
      updatedAt: now,
    });

    template.addHistory('created', { taskType: 'RECURRING' });
    return template;
  }

  /**
   * �����µ�����ģ�壨ͨ�ù������������������ݣ�
   *
   * ֧��һ���������ѭ�������ͳһ�����ӿ�
   * Story 1.1+1.2��urgency ���Ƴ������ȼ���Ϊʱ���֪�ļ���?
   */
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
  }): TaskTemplate {
    // Validate required parameters
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

    const now = new Date();
    const template = new TaskTemplate({
      identityId: params.identityId,
      title: params.title,
      description: params.description,
      taskType: params.taskType,
      timeConfig: params.timeConfig,
      recurrenceRule: params.recurrenceRule,
      reminderConfig: params.reminderConfig,
      importance: (params.importance ?? ImportanceLevel.Moderate) as ImportanceLevel,
      goalBinding: null, // Initialize as null
      folderId: params.folderId,
      tags: params.tags ?? [],
      color: params.color,
      status: TaskTemplateStatus.Active,
      createdAt: now,
      updatedAt: now,
      generateAheadDays: params.generateAheadDays ?? 30, // Default value
      version: 1,
    });

    template.addHistory('created');
    
    // ?? ���������¼�
    template.addDomainEvent<TaskEventMap['task:create']>('task:create', {
      templateId: template.id,
      goalId: null, // One-time tasks may have goal association
    });
    
    return template;
  }

  /**
   * ??ServerDTO �ָ�
   */
  public static fromServerDTO(dto: TaskTemplateServerDTO): TaskTemplate {
    const template = new TaskTemplate(
      {
        identityId: dto.identityId as IdentityId,
        title: dto.name,
        description: dto.description,
        taskType: TaskType.RECURRING, // Default, can be inferred from recurrenceRule
        timeConfig: dto.timeConfig ? TaskTimeConfig.fromDTO(dto.timeConfig) : null,
        recurrenceRule: dto.recurrenceRule
          ? RecurrenceRule.fromDTO(dto.recurrenceRule)
          : null,
        reminderConfig: dto.reminderConfig
          ? TaskReminderConfig.fromDTO(dto.reminderConfig)
          : null,
        importance: dto.importance as ImportanceLevel,
        goalBinding: dto.goalBinding ? TaskGoalBinding.fromDTO(dto.goalBinding) : null,
        checklist: dto.checklist ? dto.checklist.map((c) => ChecklistItemDefinition.fromDTO(c)) : [],
        folderId: dto.folderId as TaskFolderId | null,
        tags: dto.tags,
        color: dto.color,
        status: dto.status as TaskTemplateStatus,
        lastGeneratedDate: dto.lastGeneratedDate ? new Date(dto.lastGeneratedDate) : null,
        generateAheadDays: dto.generateAheadDays,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
        deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
        version: dto.version ?? 1,
        parentTaskId: dto.parentTaskId as TaskTemplateId | null,
        dependencyStatus: dto.dependencyStatus,
        isBlocked: dto.isBlocked,
        blockingReason: dto.blockingReason,
      },
      dto.id as TaskTemplateId,
    );

    // �ָ�ʵ��
    if (dto.instances) {
      template._instances = dto.instances.map((i) => TaskInstance.fromServerDTO(i));
    }

    return template;
  }

  /**
   * ??PersistenceDTO �ָ�
   */
  public static fromPersistenceDTO(dto: TaskTemplatePersistenceDTO): TaskTemplate {
    let timeConfig = null;
    if (dto.timeConfigType) {
      timeConfig = TaskTimeConfig.create({
        timeType: dto.timeConfigType as any,
        startDate: dto.timeConfigStartTime ? dto.timeConfigStartTime.getTime() : null,
        timePoint: null,
        timeRange: null,
      });
    }

    let recurrenceRule = null;
    if (dto.recurrenceRuleType) {
      recurrenceRule = RecurrenceRule.create({
        frequency: dto.recurrenceRuleType as RecurrenceFrequency,
        interval: dto.recurrenceRuleInterval ?? 1,
        daysOfWeek: dto.recurrenceRuleDaysOfWeek ? JSON.parse(dto.recurrenceRuleDaysOfWeek) : [],
        endDate: dto.recurrenceRuleEndDate ? dto.recurrenceRuleEndDate.getTime() : null,
        occurrences: dto.recurrenceRuleCount,
      });
    }

    let reminderConfig = null;
    if (dto.reminderConfigEnabled) {
      const triggers = [
        {
          type: 'Relative' as const,
          absoluteTime: null,
          relativeValue: dto.reminderConfigTimeOffsetMinutes,
          relativeUnit: dto.reminderConfigUnit as any,
        },
      ];
      reminderConfig = TaskReminderConfig.create({
        enabled: dto.reminderConfigEnabled,
        triggers: triggers,
      });
    }

    let goalBinding = null;
    if (dto.goalBinding) {
      goalBinding = TaskGoalBinding.fromDTO(dto.goalBinding);
    }

    const tags = dto.tags ? JSON.parse(dto.tags) : [];

    const props: TaskTemplateProps = {
      identityId: dto.identityId as IdentityId,
      title: dto.name,
      description: dto.description,
      taskType: recurrenceRule ? TaskType.RECURRING : TaskType.ONE_TIME,
      timeConfig,
      recurrenceRule,
      reminderConfig,
      importance: dto.importance as ImportanceLevel, // Now stored as string
      goalBinding,
      folderId: dto.folderId as TaskFolderId | null,
      tags,
      color: dto.color,
      status: dto.status as TaskTemplateStatus,
      lastGeneratedDate: dto.lastGeneratedDate,
      generateAheadDays: dto.generateAheadDays,
      parentTaskId: dto.parentTaskId as TaskTemplateId | null,
      dependencyStatus: dto.dependencyStatus,
      isBlocked: dto.isBlocked,
      blockingReason: dto.blockingReason,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
      version: dto.version ?? 1,
    };
    return new TaskTemplate(props, dto.id as TaskTemplateId);
  }

  // ===== �������� =====

  private getTaskTypeText(): string {
    const map: Record<TaskType, string> = {
      ONE_TIME: '��������',
      RECURRING: '�ظ�����',
    };
    return map[this._taskType];
  }

  private getImportanceText(): string {
    const map: { [key in ImportanceLevel]: string } = {
      Vital: '������Ҫ',
      Important: '�ǳ���Ҫ',
      Moderate: '�е���Ҫ',
      Minor: '��̫��Ҫ',
      Trivial: '�޹ؽ�Ҫ',
    };
    return map[this._importance as ImportanceLevel];
  }

  private getStatusText(): string {
    const map: { Active: string; Paused: string; Archived: string; Deleted: string } = {
      Active: '��Ծ',
      Paused: '��ͣ',
      Archived: '�鵵',
      Deleted: '��ɾ��',
    };
    return map[this._status as 'Active' | 'Paused' | 'Archived' | 'Deleted'];
  }
}

interface TaskTemplateProps {
  // === ͨ������ ===
  identityId: IdentityId;
  title: string;
  description?: string | null;
  taskType: TaskType; // 'ONE_TIME' | 'RECURRING'
  importance: ImportanceLevel;
  tags: string[];
  color?: string | null;
  status: TaskTemplateStatus;
  folderId?: TaskFolderId | null;

  // === Goal/KR ���� ===
  goalId?: GoalId | null;
  keyResultId?: KeyResultId | null;
  goalBinding?: TaskGoalBinding | null;

  // === Checklist ===
  checklist?: ChecklistItemDefinition[];

  // === ������֧�� ===
  parentTaskId?: TaskTemplateId | null;

  // === ѭ������ר�� ===
  timeConfig?: TaskTimeConfig | null;
  recurrenceRule?: RecurrenceRule | null;
  reminderConfig?: TaskReminderConfig | null;
  lastGeneratedDate?: Date | null;
  generateAheadDays?: number | null;

  // === һ��������ר??===
  startDate?: Date | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  note?: string | null;

  // === ������ϵ ===
  dependencyStatus?: string;
  isBlocked?: boolean;
  blockingReason?: string | null;

  // === ����ֶ�?===
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  version?: number;
}
