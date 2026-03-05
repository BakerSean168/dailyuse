/**
 * TaskTemplate aggregate (Server)
 */

import type {
  TaskTemplateClientDTO,
  TaskTemplateServerDTO,
  TaskEventMap,
} from '@dailyuse/contracts/task';
import { RecurrenceFrequency, RecurrenceEndConditionType, TaskTimeType as TimeType, TaskInstanceStatus } from '@dailyuse/contracts/task';
import { ImportanceLevel, PriorityLevel } from '@dailyuse/contracts/shared';
import { TaskTemplateStatus } from '../../domain-shared/value-objects/task-template-status';
import { TaskTemplateId } from '../../domain-shared/value-objects/task-template-id';
import { TaskFolderId } from '../../domain-shared/value-objects/task-folder-id';
import { IdentityId } from '@dailyuse/domain-shared';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/primitives';

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
  dependencyStatus: string;
  isBlocked: boolean;
  blockingReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

/**
 * TaskTemplate 聚合根
 */
export class TaskTemplate extends AggregateRoot<TaskTemplateId> {
  private _props: Omit<TaskTemplateState, 'id'>;

  // ===== 子实体集 =====
  private _history: TaskTemplateHistory[];
  private _instances: TaskInstance[];

  // ===== 构造函数（私有，通过工厂方法创建）=====
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
      dependencyStatus: rest.dependencyStatus ?? 'NONE',
      isBlocked: rest.isBlocked ?? false,
      blockingReason: rest.blockingReason ?? null,
      deletedAt: rest.deletedAt ?? null,
      version: rest.version ?? 1,
    };

    this._history = [];
    this._instances = [];
  }

  // ===== Getter ���� =====

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

  // === ���� Getter��һ���������ͨ��??===

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

  public get dependencyStatus(): string {
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

    if (this._props.taskType === TaskType.ONE_TIME) {
      // ��������ֻҪ�� startDate ������ʵ�������������ڷ�Χ��
      // ԭ�򣺵������������δ����Զ�����ڣ��û���Ȼ��Ҫ��??
      if (this._props.timeConfig?.startDate) {
        // ����Ƿ��Ѿ����ɹ��������ظ����ɣ�?
        const alreadyGenerated = this._instances.some(
          (inst) => inst.instanceDate === this._props.timeConfig!.startDate?.getTime(),
        );

        if (!alreadyGenerated) {
          const instance = TaskInstance.create({
            templateId: this.id,
            identityId: this._props.identityId,
            instanceDate: this._props.timeConfig.startDate.getTime(),
            timeConfig: this._props.timeConfig,
            importance: this._props.importance,
          });
          instances.push(instance);
          this._instances.push(instance);
        }
      }
    } else if (this._props.taskType === TaskType.RECURRING && this._props.recurrenceRule && this._props.timeConfig) {
      // �ظ����񣺸����ظ��������ɶ��ʵ�������������ڷ�Χ��??
      let currentDate = fromDate;
      while (currentDate <= toDate) {
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
        // �ƶ�����һ??
        currentDate += 86400000;
      }
    }

    if (instances.length > 0) {
      this._props.lastGeneratedDate = new Date(toDate);
      this._props.updatedAt = new Date();
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
    if (this._props.status !== TaskTemplateStatus.Active) {
      return false;
    }

    if (this._props.taskType === 'ONE_TIME') {
      return false; // ���������ڴ���??
    }

    if (!this._props.recurrenceRule) {
      return false;
    }

    // ����Ƿ����ظ��������Ч��??
    if (this._props.recurrenceRule.endDate && date > this._props.recurrenceRule.endDate.getTime()) {
      return false;
    }

    // ����??
    const rule = this._props.recurrenceRule;
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
  }

  /**
   * ��ͣģ��
   */
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
  }

  /**
   * �鵵ģ��
   */
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

  /**
   * ��ɾ��ģ??
   */
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
    
    // ?? ���������¼�
    this.addDomainEvent<TaskEventMap['task:delete']>('task:delete', {
      isSoftDelete: true,
    });
  }

  /**
   * �ָ�ģ��
   */
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

  // ===== һ��������״̬������??=====
  // NOTE: ��Щ�����ѷ����������¼ܹ�����������ҲӦ��ͨ�� TaskInstance ������״̬??
  // TaskTemplate ֻ����ģ�������ACTIVE/PAUSED/ARCHIVED/DELETED��??
  // ������Щ����ֻ��Ϊ�������ݣ�δ��Ӧ���Ƴ�??

  // ===== ʱ����򷽷�?=====

  /**
   * �ж�ģ����ָ�������Ƿ��??
   */
  public isActiveOnDate(date: number): boolean {
    if (this._props.status !== TaskTemplateStatus.Active) {
      return false;
    }

    if (this._props.taskType === TaskType.ONE_TIME) {
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

  /**
   * ��ȡָ������֮�����һ�η����??
   */
  public getNextOccurrence(afterDate: number): number | null {
    if (this._props.status !== TaskTemplateStatus.Active) {
      return null;
    }

    if (this._props.taskType === TaskType.ONE_TIME) {
      if (this._props.timeConfig?.startDate && this._props.timeConfig.startDate.getTime() > afterDate) {
        return this._props.timeConfig.startDate.getTime();
      }
      return null;
    }

    if (!this._props.recurrenceRule) {
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
        currentStatus: this._props.status,
        attemptedAction: 'updateTitle',
      });
    }
    const oldTitle = this._props.title;
    this._props.title = newTitle.trim();
    this._props.updatedAt = new Date();
    this.addHistory('title_updated', { oldTitle, newTitle: this._props.title });
    
    // ?? ���������¼�
    this.addDomainEvent<TaskEventMap['task:update']>('task:update', {
      changes: ['title'],
    });
  }

  /**
   * ��������
   */
  public updateDescription(newDescription: string | null): void {
    const oldDescription = this._props.description;
    this._props.description = newDescription ? newDescription.trim() : null;
    this._props.updatedAt = new Date();
    this.addHistory('description_updated', { oldDescription, newDescription: this._props.description });
  }

  /**
   * ���¿�ʼʱ??(ONE_TIME)
   */
  public updateStartDate(newStartDate: Date | null): void {
    if (this._props.taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have start dates', {
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

    this.addDomainEvent('task_template.schedule_time_changed', {
      taskTemplate: this.toServerDTO(),
      oldStartDate: oldStartDate,
      oldDueDate: this._props.dueDate,
      newStartDate: newStartDate,
      newDueDate: this._props.dueDate,
    });
  }

  /**
   * ���½�ֹʱ�� (ONE_TIME)
   */
  public updateDueDate(newDueDate: Date | null): void {
    if (this._props.taskType !== TaskType.ONE_TIME) {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have due dates', {
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

    this.addDomainEvent('task_template.schedule_time_changed', {
      taskTemplate: this.toServerDTO(),
      oldStartDate: this._props.startDate,
      oldDueDate: oldDueDate,
      newStartDate: this._props.startDate,
      newDueDate: newDueDate,
    });
  }

  /**
   * 更新时间配置
   */
  public updateTimeConfig(newTimeConfig: TaskTimeConfig | null): void {
    const oldTimeConfig = this._props.timeConfig?.toDTO() ?? null;
    this._props.timeConfig = newTimeConfig;
    this._props.updatedAt = new Date();

    this.addHistory('time_config_updated', {
      oldTimeConfig,
      newTimeConfig: newTimeConfig?.toDTO() ?? null,
    });

    this.addDomainEvent('task_template.schedule_time_changed', {
      taskTemplate: this.toServerDTO(),
      oldStartDate: this._props.startDate,
      oldDueDate: this._props.dueDate,
      newStartDate: this._props.startDate,
      newDueDate: this._props.dueDate,
      oldTimeConfig,
      newTimeConfig: newTimeConfig?.toDTO() ?? null,
    });
  }

  /**
   * �����ظ����� (RECURRING)
   */
  public updateRecurrenceRule(newRule: RecurrenceRule): void {
    if (this._props.taskType !== 'RECURRING') {
      throw new InvalidTaskTemplateStateError('Only RECURRING tasks have recurrence rules.', {
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
    if (this._props.taskType !== TaskType.RECURRING) {
      throw new InvalidTaskTemplateStateError('Only RECURRING tasks have recurrence rules.', {
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
        // ������������??endDate ??occurrences
        updatedRule = this._props.recurrenceRule.setEndDate(null).setOccurrences(null);
        break;

      case RecurrenceEndConditionType.EndDate:
        // ָ�����ڽ�����ʹ���ṩ�����ڣ����û����Ĭ��??30 ���?
        const endDate = customValue ?? Date.now() + 30 * 86400000; // Ĭ�� 30 ���?
        updatedRule = this._props.recurrenceRule.setEndDate(new Date(endDate));
        break;

      case RecurrenceEndConditionType.Occurrences:
        // ָ������������ʹ���ṩ�Ĵ��������û����Ĭ��??10 ??
        const occurrences = customValue ?? 10; // Ĭ�� 10 ??
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
    const oldImportance = this._props.importance;
    this._props.importance = newImportance;
    this._props.updatedAt = new Date();
    this.addHistory('priority_updated', { oldImportance, newImportance });
  }

  /**
   * ���±�ǩ
   */
  public updateTags(newTags: string[]): void {
    const oldTags = [...this._props.tags];
    this._props.tags = [...new Set(newTags)]; // ȥ��
    this._props.updatedAt = new Date();
    this.addHistory('tags_updated', { oldTags, newTags: this._props.tags });
  }

  /**
   * ������ɫ
   */
  public updateColor(newColor: string | null): void {
    const oldColor = this._props.color;
    this._props.color = newColor;
    this._props.updatedAt = new Date();
    this.addHistory('color_updated', { oldColor, newColor });
  }

  /**
   * ���±�ע (ONE_TIME)
   */
  public updateNote(newNote: string | null): void {
    if (this._props.taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have notes', {
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

  /**
   * ����Ԥ��ʱ�� (ONE_TIME)
   */
  public updateEstimatedTime(estimatedMinutes: number): void {
    if (this._props.taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks have estimated time', {
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

  /**
   * �ж��Ƿ����� (ONE_TIME)
   */
  public isOverdue(): boolean {
    if (this._props.taskType !== TaskType.ONE_TIME) {
      return false;
    }
    if (!this._props.dueDate) {
      return false;
    }
    // Note: TaskTemplateStatus doesn't have COMPLETED/CANCELLED states
    // Those checks have been removed as they belong to TaskInstance status
    return Date.now() > this._props.dueDate.getTime();
  }

  /**
   * ��ȡ�����ֹ���ڵ���??(ONE_TIME)
   */
  public getDaysUntilDue(): number | null {
    if (this._props.taskType !== TaskType.ONE_TIME) {
      return null;
    }
    if (!this._props.dueDate) {
      return null;
    }
    const now = Date.now();
    const diffMs = this._props.dueDate.getTime() - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // ===== ���ѷ��� =====

  /**
   * �Ƿ�����??
   */
  public hasReminder(): boolean {
    return this._props.reminderConfig !== null && this._props.reminderConfig.enabled;
  }

  /**
   * ��ȡָ��ʵ�����ڵ�����ʱ??
   */
  public getReminderTime(instanceDate: number): number | null {
    if (!this.hasReminder() || !this._props.reminderConfig) {
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
    if (this._props.goalBinding) {
      throw new InvalidGoalBindingError('Template is already bound to a goal');
    }

    // Check if template is archived
    if (this._props.status === TaskTemplateStatus.Archived) {
      throw new TaskTemplateArchivedError(this.id);
    }

    this._props.goalBinding = TaskGoalBinding.fromDTO({
      goalId,
      keyResultId,
      goalRecordValue,
    });
    this._props.updatedAt = new Date();
    this.addHistory('goal_bound', { goalId, keyResultId, goalRecordValue });
  }

  /**
   * ���Ŀ���
   */
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
    this._props.updatedAt = new Date();
    this.addHistory('goal_unbound');
  }

  /**
   * �Ƿ�󶨵��??
   */
  public isLinkedToGoal(): boolean {
    return this._props.goalBinding !== null;
  }

  /**
   * �󶨵�Ŀ??(ONE_TIME) - �°汾֧�����ֶ�
   */
  public linkToGoal(goalId: string, keyResultId?: string): void {
    if (this._props.taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can be linked to goals', {
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

  /**
   * ���Ŀ������?(ONE_TIME)
   */
  public unlinkFromGoal(): void {
    if (this._props.taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can be unlinked from goals', {
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

  // ===== �����������??(ONE_TIME) =====

  /**
   * ��������??
   */
  public addSubtask(subtaskId: string): void {
    if (this._props.taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have subtasks', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'addSubtask',
      });
    }
    // ʵ��ʵ����Ӧ��ͨ�� repository ��֤ subtaskId �Ƿ����?
    this._props.updatedAt = new Date();
    this.addHistory('subtask_added', { subtaskId });
  }

  /**
   * �Ƴ�����??
   */
  public removeSubtask(subtaskId: string): void {
    if (this._props.taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have subtasks', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'removeSubtask',
      });
    }
    this._props.updatedAt = new Date();
    this.addHistory('subtask_removed', { subtaskId });
  }

  /**
   * �ж��Ƿ���������
   */
  public isSubtask(): boolean {
    return this._props.parentTaskId !== null;
  }

  /**
   * ��ȡ������UUID
   */
  public getParentTaskId(): string | null {
    return this._props.parentTaskId;
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
    if (this._props.taskType !== TaskType.ONE_TIME) {
      return { level: PriorityLevel.Low as PriorityLevel, score: 0 };
    }

    const currentTime = new Date();
    const dueDateObj = this._props.dueDate;

    const score = calculateTaskPriority(this._props.importance, dueDateObj, currentTime);
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
  public markAsBlocked(reason: string, dependencyTaskId?: string): void {
    if (this._props.taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError(
        'Only ONE_TIME tasks can be blocked by dependencies',
        {
          templateId: this.id,
          currentStatus: this._props.status,
          attemptedAction: 'markAsBlocked',
        },
      );
    }
    this._props.isBlocked = true;
    this._props.blockingReason = reason;
    this._props.dependencyStatus = 'BLOCKED';
    this._props.updatedAt = new Date();
    this.addHistory('marked_as_blocked', { reason, dependencyTaskId });
  }

  /**
   * ���Ϊ��??(�����������?
   */
  public markAsReady(): void {
    if (this._props.taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have dependency status', {
        templateId: this.id,
        currentStatus: this._props.status,
        attemptedAction: 'markAsReady',
      });
    }
    this._props.isBlocked = false;
    this._props.blockingReason = null;
    this._props.dependencyStatus = 'READY';
    this._props.updatedAt = new Date();
    this.addHistory('marked_as_ready');
  }

  /**
   * ��������״??
   */
  public updateDependencyStatus(status: 'Pending' | 'READY' | 'BLOCKED'): void {
    if (this._props.taskType !== 'ONE_TIME') {
      throw new InvalidTaskTemplateStateError('Only ONE_TIME tasks can have dependency status', {
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

  // ===== ��ʷ��¼���� =====

  /**
   * ������ʷ��¼
   */
  public addHistory(action: string, changes?: any): void {
    const history = TaskTemplateHistory.create({
      templateId: this.id,
      action,
      changes: changes ? JSON.stringify(changes) : null,
    });
    this._history.push(history);
    this._props.updatedAt = new Date();
  }

  // ===== ��ʵ�������??=====

  /**
   * ����ʵ��
   */
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

  /**
   * ����ʵ��
   */
  public addInstance(instance: TaskInstance): void {
    this._instances.push(instance);
    this._props.updatedAt = new Date();
  }

  /**
   * �Ƴ�ʵ��
   */
  public removeInstance(instanceId: string): TaskInstance | null {
    const index = this._instances.findIndex((i) => i.id === instanceId);
    if (index === -1) return null;
    const [removed] = this._instances.splice(index, 1);
    this._props.updatedAt = new Date();
    return removed;
  }

  /**
   * ��ȡʵ��
   */
  public getInstance(instanceId: string): TaskInstance | null {
    return this._instances.find((i) => i.id === instanceId) ?? null;
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
      identityId: this._props.identityId,
      name: this._props.title,
      description: this._props.description,
      timeConfig: this._props.timeConfig?.toDTO() ?? null,
      recurrenceRule: this._props.recurrenceRule?.toDTO() ?? null,
      reminderConfig: this._props.reminderConfig?.toDTO() ?? null,
      importance: this._props.importance,
      priority: this._props.taskType === 'ONE_TIME' ? this.getPriority().score : undefined,
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
    const completedCount = this._instances.filter((i) => i.status === 'Completed').length;
    const pendingCount = this._instances.filter((i) => i.status === 'Pending').length;
    const totalCount = this._instances.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // ONE_TIME ��������ȼ�����?
    const priority = this._props.taskType === 'ONE_TIME' ? this.getPriority() : undefined;

    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.title,
      description: this._props.description,
      timeConfig: this._props.timeConfig?.toDTO() ?? { timeType: 'AllDay', startDate: null, timePoint: null, timeRange: null },
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

  // ===== 工厂方法 =====

  /**
   * 创建一次性任务（便捷工厂方法）
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
      taskType: TaskType.ONE_TIME,
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
      dependencyStatus: 'Pending',
      isBlocked: false,
      blockingReason: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });

    template.addHistory('created', { taskType: 'ONE_TIME' });
    return template;
  }

  /**
   * 创建循环任务（便捷工厂方法）
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
      taskType: TaskType.RECURRING,
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
      dependencyStatus: 'NONE',
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

    template.addHistory('created', { taskType: 'RECURRING' });
    return template;
  }

  /**
   * 创建新的任务模板（通用工厂方法）
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
    if (params.taskType === TaskType.RECURRING && !params.recurrenceRule) {
      throw new InvalidTaskTemplateStateError('Recurrence rule is required for recurring tasks', {
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
      goalBinding: null,
      folderId: params.folderId ?? null,
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
      dependencyStatus: 'NONE',
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
      templateId: template.id,
      goalId: null,
    });
    
    return template;
  }

  /**
   * 🏭 恢复工厂：从状态恢复聚合
   */
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

  // ===== �������� =====

  private getTaskTypeText(): string {
    const map: Record<TaskType, string> = {
      ONE_TIME: '��������',
      RECURRING: '�ظ�����',
    };
    return map[this._props.taskType];
  }

  private getImportanceText(): string {
    const map: { [key in ImportanceLevel]: string } = {
      Vital: '������Ҫ',
      Important: '�ǳ���Ҫ',
      Moderate: '�е���Ҫ',
      Minor: '��̫��Ҫ',
      Trivial: '�޹ؽ�Ҫ',
    };
    return map[this._props.importance as ImportanceLevel];
  }

  private getStatusText(): string {
    const map: { Active: string; Paused: string; Archived: string; Deleted: string } = {
      Active: '��Ծ',
      Paused: '��ͣ',
      Archived: '�鵵',
      Deleted: '��ɾ��',
    };
    return map[this._props.status as 'Active' | 'Paused' | 'Archived' | 'Deleted'];
  }
}
