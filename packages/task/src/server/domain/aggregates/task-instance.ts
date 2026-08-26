import type { Instant } from '@memoflow/contracts/primitives';
/**
 * TaskInstance Aggregate Root (Server)
 *
 * Manages the full lifecycle of a task instance:
 * - State transitions (Pending -> InProgress -> Completed/Missed/Skipped)
 * - Execution time tracking (start time, end time, actual duration)
 * - Completion records (status, rating, notes)
 * - Skip records (reason, skip time)
 */

import type {
  TaskInstanceClientDTO,
  TaskInstanceServerDTO,
  TaskEventMap,
  TaskGoalBindingDTO,
} from '@memoflow/contracts/task';
import { TaskInstanceStatus, TaskTimeType as TimeType } from '@memoflow/contracts/task';
import { TaskTemplateId } from '../../domain/value-objects/task-template-id';
import { TaskInstanceId } from '../../domain/value-objects/task-instance-id';
import { IdentityId } from '@memoflow/domain-shared';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { AggregateRoot } from '@memoflow/utils/domain';
import { TaskTimeConfig, CompletionRecord, SkipRecord } from '../value-objects';
import { buildTaskInstanceOccurrenceKey } from '../value-objects/task-instance-occurrence-key';
import { asHm, asInstant, combineYmdHmWithTimeZone, createTimeFacade, resolveTimeZoneId } from '@memoflow/time';

const taskTime = createTimeFacade();

function minuteOfDayToHm(minute: number): ReturnType<typeof asHm> {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return asHm(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
}

/**
 * Internal props interface for TaskInstance
 */
export interface TaskInstanceState {
  id: TaskInstanceId;
  templateId: TaskTemplateId;
  identityId: IdentityId;
  instanceDate: number;
  /** R2-1：确定性幂等键 `templateId:localDate`；数据库唯一约束防重复生成。 */
  occurrenceKey: string | null;
  timeConfig: TaskTimeConfig;
  importance: ImportanceLevel;
  status: TaskInstanceStatus;
  completionRecord: CompletionRecord | null;
  skipRecord: SkipRecord | null;
  actualStartTime: number | null;
  actualEndTime: number | null;
  note: string | null;
  createdAt: Instant;
  updatedAt: Instant;
  version: number;
  deletedAt: Instant | null;
}

/** TaskInstance aggregate root. */
export class TaskInstance extends AggregateRoot<TaskInstanceId> {
  private _props: TaskInstanceState;

  // ===== 2. Constructor (Private) =====
  private constructor(state: TaskInstanceState) {
    super(state.id);
    if (!Object.values(TaskInstanceStatus).includes(state.status)) {
      throw new Error(`Invalid persisted TaskInstanceStatus: ${String(state.status)}`);
    }
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

  public get occurrenceKey(): string | null {
    return this._props.occurrenceKey;
  }

  public get timeConfig(): TaskTimeConfig {
    return this._props.timeConfig;
  }

  public get importance(): ImportanceLevel {
    return this._props.importance;
  }


  /**
   * Canonical completion-window end for this occurrence.
   * `timePoint` / `timeRange` are local-day minutes, never epoch timestamps.
   * The recurrence/generation path supplies `instanceDate` as the occurrence-day anchor.
   */
  public get dueDate(): number | null {
    const dayStart = taskTime.calendar.startOfDay(asInstant(this._props.instanceDate));
    if (this._props.timeConfig.timeType === TimeType.AllDay) {
      return taskTime.calendar.endOfDay(dayStart);
    }

    const minute =
      this._props.timeConfig.timeType === TimeType.TimePoint
        ? this._props.timeConfig.timePoint
        : this._props.timeConfig.timeRange?.end;
    if (minute == null) return null;

    const day = taskTime.calendar.toYmd(dayStart);
    return combineYmdHmWithTimeZone(
      day,
      minuteOfDayToHm(minute),
      resolveTimeZoneId('local'),
    );
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

  public get createdAt(): Instant {
    const v = this._props.createdAt;
    return v as Instant;
  }

  public get updatedAt(): Instant {
    const v = this._props.updatedAt;
    return v as Instant;
  }

  public get version(): number {
    return this._props.version;
  }

  /** R2-5a：状态变更后递增版本（乐观锁）。 */
  private advanceVersion(): void {
    this._props.version += 1;
  }

  public get deletedAt(): Instant | null {
    const v = this._props.deletedAt;
    if (v == null) return null;
    return v as Instant;
  }

  // ===== Business Methods =====

  /** Starts the task. */
  public start(): void {
    if (!this.canStart()) {
      throw new Error('Cannot start task in current state');
    }

    this._props.status = TaskInstanceStatus.InProgress;
    this._props.actualStartTime = Date.now();
    this._props.updatedAt = Date.now();
    this.advanceVersion();
  }

  /**
   * Completes the task.
   *
   * `goalContext` 由 Task 应用层在调用前填充模板绑定与标题，使
   * EachCompletion 事件自包含。PlanCompletion eligibility 不属于 occurrence
   * event；它由 Task Plan outcome transition 单独发布。
   */
  public complete(
    actualDuration?: number,
    note?: string,
    rating?: number,
    goalContext?: {
      taskTitle: string;
      goalBinding: TaskGoalBindingDTO | null;
    },
  ): void {
    if (!this.canComplete()) {
      throw new Error('Cannot complete task in current state');
    }

    const now = Date.now();
    const previousStatus = this._props.status;
    this._props.status = TaskInstanceStatus.Completed;
    this._props.actualEndTime = now;
    this._props.skipRecord = null;
    if (
      note === undefined &&
      (previousStatus === TaskInstanceStatus.Missed || previousStatus === TaskInstanceStatus.Skipped)
    ) {
      this._props.note = null;
    }

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

    this._props.updatedAt = now;
    this.advanceVersion();

    // Trigger domain event（payload 自包含，供 Goal 等跨模块订阅方直接消费）
    this.addDomainEvent<TaskEventMap['task:instance-completed']>('task:instance-completed', {
      identityId: this._props.identityId,
      taskInstanceId: this.id,
      taskTemplateId: this._props.templateId,
      completedAt: now,
      taskTitle: goalContext?.taskTitle ?? '',
      goalBinding: goalContext?.goalBinding ?? null,
    });
  }

  /** Returns a completed instance to Pending and identifies the contribution to reverse. */
  public uncomplete(): void {
    if (this._props.status !== TaskInstanceStatus.Completed) {
      throw new Error('Only a completed task can be uncompleted');
    }

    const now = Date.now();
    this._props.status = TaskInstanceStatus.Pending;
    this._props.completionRecord = null;
    this._props.actualEndTime = null;
    this._props.updatedAt = now;
    this.advanceVersion();

    this.addDomainEvent<TaskEventMap['task:instance-uncompleted']>(
      'task:instance-uncompleted',
      {
        identityId: this._props.identityId,
        taskInstanceId: this.id,
        taskTemplateId: this._props.templateId,
        uncompletedAt: now,
      },
    );
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

    this._props.updatedAt = now;
    this.advanceVersion();

    this.addDomainEvent<TaskEventMap['task:instance-skipped']>('task:instance-skipped', {
      identityId: this._props.identityId,
      taskInstanceId: this.id,
      taskTemplateId: this._props.templateId,
      skippedAt: now,
      reason: reason ?? null,
    });
  }

  /** Records an explicit Missed fact. Time passing never calls this method implicitly. */
  public markMissed(reason?: string): void {
    if (!this.canMarkMissed()) {
      throw new Error('Cannot mark task missed in current state');
    }

    const now = Date.now();
    this._props.status = TaskInstanceStatus.Missed;
    this._props.actualEndTime = null;
    if (reason !== undefined) {
      this._props.note = reason;
    }
    this._props.updatedAt = now;
    this.advanceVersion();
  }

  /** Applies template-owned fields only while this is an unstarted future instance. */
  public applyPlanProjection(params: {
    effectiveFrom: number;
    timeConfig?: TaskTimeConfig;
    importance?: ImportanceLevel;
  }): boolean {
    if (
      this._props.status !== TaskInstanceStatus.Pending ||
      this._props.instanceDate <= params.effectiveFrom
    ) {
      return false;
    }

    let changed = false;
    if (params.timeConfig !== undefined) {
      this._props.timeConfig = params.timeConfig;
      changed = true;
    }
    if (params.importance !== undefined && params.importance !== this._props.importance) {
      this._props.importance = params.importance;
      changed = true;
    }
    if (changed) {
      this._props.updatedAt = Date.now();
      this.advanceVersion();
    }
    return changed;
  }

  /** Business state check methods. */
  public canStart(): boolean {
    return this._props.status === TaskInstanceStatus.Pending;
  }

  public canComplete(): boolean {
    return (
      this._props.status === TaskInstanceStatus.Pending ||
      this._props.status === TaskInstanceStatus.InProgress ||
      this._props.status === TaskInstanceStatus.Missed ||
      this._props.status === TaskInstanceStatus.Skipped
    );
  }

  public canSkip(): boolean {
    return (
      this._props.status === TaskInstanceStatus.Pending ||
      this._props.status === TaskInstanceStatus.InProgress
    );
  }

  public canMarkMissed(): boolean {
    return (
      this._props.status === TaskInstanceStatus.Pending ||
      this._props.status === TaskInstanceStatus.InProgress
    );
  }

  /** Derived only: clock movement never mutates persisted occurrence status. */
  public isOverdue(now = Date.now()): boolean {
    if (
      this._props.status !== TaskInstanceStatus.Pending &&
      this._props.status !== TaskInstanceStatus.InProgress
    ) {
      return false;
    }

    const dueAt = this.dueDate;
    return dueAt !== null && now > dueAt;
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
      status: this._props.status,
      isOverdue: this.isOverdue(),
      actualStartTime: this._props.actualStartTime,
      actualEndTime: this._props.actualEndTime,
      comment: this._props.note,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      version: this._props.version,
      deletedAt: this._props.deletedAt ? this._props.deletedAt : null,
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
      status: this._props.status,
      isOverdue: this.isOverdue(),
      actualStartTime: this._props.actualStartTime,
      actualEndTime: this._props.actualEndTime,
      comment: this._props.note,
      version: this._props.version,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt ?? null,
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
    const instance = new TaskInstance({
      id: TaskInstanceId.generate(),
      templateId: params.templateId,
      identityId: params.identityId,
      instanceDate: params.instanceDate,
      occurrenceKey: buildTaskInstanceOccurrenceKey(
        String(params.templateId),
        params.instanceDate,
      ),
      timeConfig: params.timeConfig,
      importance: params.importance,
      status: TaskInstanceStatus.Pending,
      completionRecord: null,
      skipRecord: null,
      actualStartTime: null,
      actualEndTime: null,
      note: null,
      createdAt: now,
      updatedAt: now,
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
      Missed: '已错过',
      Skipped: '已豁免',
    };
    return statusMap[this._props.status];
  }

  private getStatusColor(): string {
    const colorMap: Record<TaskInstanceStatus, string> = {
      Pending: 'blue',
      InProgress: 'orange',
      Completed: 'green',
      Missed: 'red',
      Skipped: 'gray',
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
