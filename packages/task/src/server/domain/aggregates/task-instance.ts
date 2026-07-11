/**
 * TaskInstance Aggregate Root (Server)
 *
 * Manages the full lifecycle of a task instance:
 * - State transitions (PENDING -> IN_PROGRESS -> COMPLETED/SKIPPED/EXPIRED)
 * - Execution time tracking (start time, end time, actual duration)
 * - Completion records (status, rating, notes)
 * - Skip records (reason, skip time)
 */

import type {
  TaskInstanceClientDTO,
  TaskInstanceServerDTO,
  TaskEventMap,
  TaskGoalBindingDTO,
} from '@dailyuse/contracts/task';
import { TaskInstanceStatus, TaskTimeType as TimeType } from '@dailyuse/contracts/task';
import { TaskTemplateId } from '../../domain/value-objects/task-template-id';
import { TaskInstanceId } from '../../domain/value-objects/task-instance-id';
import { IdentityId } from '@dailyuse/domain-shared';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils/domain';
import { TaskTimeConfig, CompletionRecord, SkipRecord } from '../value-objects';

/**
 * Internal props interface for TaskInstance
 */
export interface TaskInstanceState {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;
  instanceDate: number;
  timeConfig: TaskTimeConfig;
  importance: ImportanceLevel;
  priority?: number;
  status: TaskInstanceStatus;
  completionRecord: CompletionRecord | null;
  skipRecord: SkipRecord | null;
  actualStartTime: number | null;
  actualEndTime: number | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  deletedAt: Date | null;
}

/** TaskInstance aggregate root. */
export class TaskInstance extends AggregateRoot<TaskInstanceId> {
  private _props: TaskInstanceState;

  // ===== 2. Constructor (Private) =====
  private constructor(state: TaskInstanceState) {
    super(state.id);
    this._props = state;
  }

  // ===== 3. Public Properties (Getters) =====
  public get templateId(): TaskTemplateId {
    return this._props.templateId;
  }

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get instanceDate(): number {
    return this._props.instanceDate;
  }

  public get timeConfig(): TaskTimeConfig {
    return this._props.timeConfig;
  }

  public get importance(): ImportanceLevel {
    return this._props.importance;
  }

  public get priority(): number | undefined {
    return this._props.priority;
  }

  /**
   * Gets the task instance's due time based on timeConfig.
   * Used for priority calculation.
   */
  public get dueDate(): number | null {
    if (this._props.timeConfig.timeType === TimeType.TimePoint) {
      return this._props.timeConfig.timePoint;
    } else if (this._props.timeConfig.timeType === TimeType.TimeRange) {
      return this._props.timeConfig.timeRange?.end ?? null;
    } else {
      // All-day task: due at end of instanceDate day (23:59:59)
      return this._props.instanceDate + 86400000 - 1;
    }
  }

  public get status(): TaskInstanceStatus {
    return this._props.status;
  }

  public get completionRecord(): CompletionRecord | null {
    return this._props.completionRecord;
  }

  public get skipRecord(): SkipRecord | null {
    return this._props.skipRecord;
  }

  public get actualStartTime(): number | null {
    return this._props.actualStartTime;
  }

  public get actualEndTime(): number | null {
    return this._props.actualEndTime;
  }

  public get note(): string | null {
    return this._props.note;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  public get version(): number {
    return this._props.version;
  }

  public get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // ===== Business Methods =====

  /** Starts the task. */
  public start(): void {
    if (!this.canStart()) {
      throw new Error('Cannot start task in current state');
    }

    this._props.status = TaskInstanceStatus.InProgress;
    this._props.actualStartTime = Date.now();
    this._props.updatedAt = new Date();
  }

  /**
   * Completes the task.
   *
   * `goalContext` 由 Task 应用层在调用前算好（模板绑定、是否全部实例完成、标题），
   * 用于把 task:instance-completed 事件的 payload 填成自包含（ADR-033 范式 A）。
   * 跨聚合的判定属应用层职责，聚合只负责把结果嵌进自己的领域事件。
   */
  public complete(
    actualDuration?: number,
    note?: string,
    rating?: number,
    goalContext?: {
      taskTitle: string;
      goalBinding: TaskGoalBindingDTO | null;
      allInstancesCompleted: boolean;
    },
  ): void {
    if (!this.canComplete()) {
      throw new Error('Cannot complete task in current state');
    }

    const now = Date.now();
    this._props.status = TaskInstanceStatus.Completed;
    this._props.actualEndTime = now;

    // Create completion record
    this._props.completionRecord = CompletionRecord.create({
      completedAt: now,
      actualDuration:
        actualDuration ?? (this._props.actualStartTime ? now - this._props.actualStartTime : null),
      note: note ?? null,
      rating: rating ?? null,
    });

    if (note) {
      this._props.note = note;
    }

    this._props.updatedAt = new Date(now);

    // Trigger domain event（payload 自包含，供 Goal 等跨模块订阅方直接消费）
    this.addDomainEvent<TaskEventMap['task:instance-completed']>('task:instance-completed', {
      identityId: this._props.identityId,
      taskInstanceId: this.id,
      taskTemplateId: this._props.templateId,
      completedAt: now,
      taskTitle: goalContext?.taskTitle ?? '',
      goalBinding: goalContext?.goalBinding ?? null,
      allInstancesCompleted: goalContext?.allInstancesCompleted ?? false,
    });
  }

  /** Skips the task. */
  public skip(reason?: string): void {
    if (!this.canSkip()) {
      throw new Error('Cannot skip task in current state');
    }

    const now = Date.now();
    this._props.status = TaskInstanceStatus.Skipped;

    // Create skip record
    this._props.skipRecord = SkipRecord.create({
      skippedAt: now,
      reason: reason ?? null,
    });

    if (reason) {
      this._props.note = reason;
    }

    this._props.updatedAt = new Date(now);

    this.addDomainEvent<TaskEventMap['task:instance-skipped']>('task:instance-skipped', {
      identityId: this._props.identityId,
      taskInstanceId: this.id,
      taskTemplateId: this._props.templateId,
      skippedAt: now,
      reason: reason ?? null,
    });
  }

  /** Marks the instance as expired. */
  public markExpired(): void {
    if (
      this._props.status === TaskInstanceStatus.Pending ||
      this._props.status === TaskInstanceStatus.InProgress
    ) {
      this._props.status = TaskInstanceStatus.Expired;
      this._props.updatedAt = new Date();
    }
  }

  /** Business state check methods. */
  public canStart(): boolean {
    return this._props.status === TaskInstanceStatus.Pending;
  }

  public canComplete(): boolean {
    return (
      this._props.status === TaskInstanceStatus.Pending ||
      this._props.status === TaskInstanceStatus.InProgress
    );
  }

  public canSkip(): boolean {
    return (
      this._props.status === TaskInstanceStatus.Pending ||
      this._props.status === TaskInstanceStatus.InProgress
    );
  }

  public isOverdue(): boolean {
    if (
      this._props.status !== TaskInstanceStatus.Pending &&
      this._props.status !== TaskInstanceStatus.InProgress
    ) {
      return false;
    }

    const now = Date.now();
    // Check if past the instance date
    return now > this._props.instanceDate + 86400000; // Overdue after 1 day
  }

  // ===== 6. Serialization =====

  public toServerDTO(): TaskInstanceServerDTO {
    return {
      id: this.id.toString() as TaskInstanceId,
      templateId: this._props.templateId.toString() as TaskTemplateId,
      identityId: this._props.identityId.toString() as IdentityId,
      instanceDate: this._props.instanceDate,
      timeConfig: this._props.timeConfig.toDTO(),
      importance: this._props.importance,
      priority: this._props.priority,
      status: this._props.status,
      actualStartTime: this._props.actualStartTime,
      actualEndTime: this._props.actualEndTime,
      comment: this._props.note,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      version: this._props.version,
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
    };
  }

  public toClientDTO(): TaskInstanceClientDTO {
    return {
      id: this.id.toString() as TaskInstanceId,
      templateId: this._props.templateId.toString() as TaskTemplateId,
      identityId: this._props.identityId.toString() as IdentityId,
      instanceDate: this._props.instanceDate,
      timeConfig: this._props.timeConfig.toDTO(),
      importance: this._props.importance,
      priority: this._props.priority,
      status: this._props.status,
      actualStartTime: this._props.actualStartTime,
      actualEndTime: this._props.actualEndTime,
      comment: this._props.note,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

  // ===== 4. Factory Methods =====

  /**
   * Factory method: creates a new task instance.
   *
   * Note: does not publish domain events.
   * Reminders are managed by ScheduleTask.
   */
  public static create(params: {
    templateId: TaskTemplateId;
    identityId: IdentityId;
    instanceDate: number;
    timeConfig: TaskTimeConfig;
    importance: ImportanceLevel;
  }): TaskInstance {
    if (!params.templateId) {
      throw new Error('Template ID is required');
    }
    if (!params.identityId) {
      throw new Error('Identity ID is required');
    }
    if (!Number.isFinite(params.instanceDate)) {
      throw new Error('Instance date must be a valid timestamp');
    }
    if (!params.timeConfig) {
      throw new Error('Time configuration is required');
    }

    const now = Date.now();
    const nowDate = new Date(now);
    const instance = new TaskInstance({
      id: TaskInstanceId.generate(),
      templateId: params.templateId,
      identityId: params.identityId,
      instanceDate: params.instanceDate,
      timeConfig: params.timeConfig,
      importance: params.importance,
      status: TaskInstanceStatus.Pending,
      completionRecord: null,
      skipRecord: null,
      actualStartTime: null,
      actualEndTime: null,
      note: null,
      createdAt: nowDate,
      updatedAt: nowDate,
      version: 1,
      deletedAt: null,
    });

    return instance;
  }

  /** Factory method: restores an aggregate from persisted state. */
  public static load(state: TaskInstanceState): TaskInstance {
    return new TaskInstance(state);
  }

  // ===== Helper Methods =====

  private getStatusText(): string {
    const statusMap: Record<TaskInstanceStatus, string> = {
      Pending: '待完成',
      InProgress: '进行中',
      Completed: '已完成',
      Skipped: '已跳过',
      Expired: '已过期',
    };
    return statusMap[this._props.status];
  }

  private getStatusColor(): string {
    const colorMap: Record<TaskInstanceStatus, string> = {
      Pending: 'blue',
      InProgress: 'orange',
      Completed: 'green',
      Skipped: 'gray',
      Expired: 'red',
    };
    return colorMap[this._props.status];
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }
}
