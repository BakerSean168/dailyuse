/**
 * TaskInstance 聚合根实现 (Server)
 * 任务实例 - 聚合根
 * 
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念，代表一个业务边界：
 * - 唯一标识：通过 ID 区分不同的聚合实例
 * - 事务边界：所有对聚合的修改在一个事务内完成
 * - 统一性：聚合保证内部状态的一致性
 * - 生命周期：聚合有创建、修改、删除的完整生命周期
 * 
 * 【TaskInstance 职责】
 * 管理任务实例的完整生命周期：
 * - 状态转换（PENDING → IN_PROGRESS → COMPLETED/SKIPPED/EXPIRED）
 * - 执行时间追踪（开始时间、结束时间、实际耗时）
 * - 完成记录（完成状态、评分、备注）
 * - 跳过记录（跳过原因、跳过时间）
 */

import type { TaskInstanceClientDTO, TaskInstancePersistenceDTO, TaskInstanceServer, TaskInstanceServerDTO, TaskEventMap } from '@dailyuse/contracts/task';
import { TaskInstanceStatus, TimeType, TaskTemplateId, TaskInstanceId } from '@dailyuse/domain-shared/task';
import { ImportanceLevel, IdentityId } from '@dailyuse/domain-shared';
import { AggregateRoot } from '@dailyuse/utils';
import { TaskTimeConfig, CompletionRecord, SkipRecord } from '../value-objects';

/**
 * TaskInstance 聚合根
 */
export class TaskInstance extends AggregateRoot<TaskInstanceId> implements TaskInstanceServer {
  // ===== 1. 内部状态 (Backing Fields) =====
  private _templateId: TaskTemplateId;
  private _identityId: IdentityId;
  private _instanceDate: number;
  private _timeConfig: TaskTimeConfig;
  private _importance: ImportanceLevel;
  private _priority?: number;
  private _status: TaskInstanceStatus;
  private _completionRecord: CompletionRecord | null;
  private _skipRecord: SkipRecord | null;
  private _actualStartTime: number | null;
  private _actualEndTime: number | null;
  private _note: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 2. 构造函数 (Private) =====
  private constructor(params: {
    id?: TaskInstanceId;
    templateId: TaskTemplateId;
    identityId: IdentityId;
    instanceDate: number;
    timeConfig: TaskTimeConfig;
    importance: ImportanceLevel;
    priority?: number;
    status: TaskInstanceStatus;
    completionRecord?: CompletionRecord | null;
    skipRecord?: SkipRecord | null;
    actualStartTime?: number | null;
    actualEndTime?: number | null;
    note?: string | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.id || TaskInstanceId.generate());
    this._templateId = params.templateId;
    this._identityId = params.identityId;
    this._instanceDate = params.instanceDate;
    this._timeConfig = params.timeConfig;
    this._importance = params.importance;
    this._priority = params.priority;
    this._status = params.status;
    this._completionRecord = params.completionRecord ?? null;
    this._skipRecord = params.skipRecord ?? null;
    this._actualStartTime = params.actualStartTime ?? null;
    this._actualEndTime = params.actualEndTime ?? null;
    this._note = params.note ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== 3. 公共属性 (Getters) =====
  public get templateId(): TaskTemplateId {
    return this._templateId;
  }

  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get instanceDate(): number {
    return this._instanceDate;
  }

  public get timeConfig(): TaskTimeConfig {
    return this._timeConfig;
  }

  public get importance(): ImportanceLevel {
    return this._importance;
  }

  public get priority(): number | undefined {
    return this._priority;
  }

  /**
   * 获取任务实例的截止时间（根据 timeConfig 计算）
   * Story 1.5: 用于优先级计算
   */
  public get dueDate(): number | null {
    if (this._timeConfig.timeType === TimeType.TIME_POINT) {
      return this._timeConfig.timePoint;
    } else if (this._timeConfig.timeType === TimeType.TIME_RANGE) {
      return this._timeConfig.timeRange?.end ?? null;
    } else {
      // 全天任务截止到 instanceDate 当天结束 (23:59:59)
      // instanceDate 通常是当天的 00:00:00 (本地时间或 UTC?)
      // 假设 instanceDate 是该日的起始时间(UTC 0点 或 Local 0点)
      // 如果没有更好的信息，就使用 instanceDate + 1 天
      return this._instanceDate + 86400000 - 1; 
    }
  }

  public get status(): TaskInstanceStatus {
    return this._status;
  }

  public get completionRecord(): CompletionRecord | null {
    return this._completionRecord;
  }

  public get skipRecord(): SkipRecord | null {
    return this._skipRecord;
  }

  public get actualStartTime(): number | null {
    return this._actualStartTime;
  }

  public get actualEndTime(): number | null {
    return this._actualEndTime;
  }

  public get note(): string | null {
    return this._note;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 业务方法 =====

  /**
   * 开始任务
   */
  public start(): void {
    if (!this.canStart()) {
      throw new Error('Cannot start task in current state');
    }

    this._status = 'IN_PROGRESS' as TaskInstanceStatus;
    this._actualStartTime = Date.now();
    this._updatedAt = new Date();
  }

  /**
   * 完成任务
   */
  public complete(actualDuration?: number, note?: string, rating?: number): void {
    if (!this.canComplete()) {
      throw new Error('Cannot complete task in current state');
    }

    const now = Date.now();
    this._status = 'COMPLETED' as TaskInstanceStatus;
    this._actualEndTime = now;

    // 创建完成记录
    this._completionRecord = new CompletionRecord({
      completedAt: now,
      actualDuration:
        actualDuration ?? (this._actualStartTime ? now - this._actualStartTime : null),
      note: note ?? null,
      rating: rating ?? null,
      taskUuid: this.uuid,
      completionStatus: 'completed',
    });

    if (note) {
      this._note = note;
    }

    this._updatedAt = now;
    
    // 🎯 触发领域事件
    this.addDomainEvent<TaskEventMap['task:complete']>('task:complete', {
      goalId: null, // TaskInstance doesn't store goalId directly
    });
  }

  /**
   * 跳过任务
   */
  public skip(reason?: string): void {
    if (!this.canSkip()) {
      throw new Error('Cannot skip task in current state');
    }

    const now = Date.now();
    this._status = 'SKIPPED' as TaskInstanceStatus;

    // 创建跳过记录
    this._skipRecord = new SkipRecord({
      skippedAt: now,
      reason: reason ?? null,
    });

    if (reason) {
      this._note = reason;
    }

    this._updatedAt = now;
  }

  /**
   * 标记为过期
   */
  public markExpired(): void {
    if (this._status === 'PENDING' || this._status === 'IN_PROGRESS') {
      this._status = 'EXPIRED' as TaskInstanceStatus;
      this._updatedAt = new Date();
    }
  }

  /**
   * 业务判断方法
   */
  public canStart(): boolean {
    return this._status === 'PENDING';
  }

  public canComplete(): boolean {
    return this._status === 'PENDING' || this._status === 'IN_PROGRESS';
  }

  public canSkip(): boolean {
    return this._status === 'PENDING' || this._status === 'IN_PROGRESS';
  }

  public isOverdue(): boolean {
    if (this._status !== 'PENDING' && this._status !== 'IN_PROGRESS') {
      return false;
    }

    const now = Date.now();
    // 检查是否超过实例日期
    return now > this._instanceDate + 86400000; // 超过1天视为过期
  }

  // ===== 6. 序列化 (Serialization) =====

  public toServerDTO(): TaskInstanceServerDTO {
    return {
      id: this.id,
      templateId: this._templateId,
      identityId: this._identityId,
      instanceDate: this._instanceDate,
      timeConfig: this._timeConfig.toServerDTO(),
      importance: this._importance,
      priority: this._priority,
      status: this._status,
      completionRecord: this._completionRecord?.toServerDTO() ?? null,
      skipRecord: this._skipRecord?.toServerDTO() ?? null,
      actualStartTime: this._actualStartTime,
      actualEndTime: this._actualEndTime,
      note: this._note,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toClientDTO(): TaskInstanceClientDTO {
    const instanceDateFormatted = new Date(this._instanceDate).toLocaleDateString('zh-CN');
    const statusText = this.getStatusText();
    const statusColor = this.getStatusColor();
    const actualDuration =
      this._actualStartTime && this._actualEndTime
        ? this._actualEndTime - this._actualStartTime
        : null;
    const durationText = actualDuration ? this.formatDuration(actualDuration) : null;

    return {
      id: this.id,
      templateId: this._templateId,
      identityId: this._identityId,
      instanceDate: this._instanceDate,
      timeConfig: this._timeConfig.toClientDTO(),
      importance: this._importance,
      priority: this._priority,
      status: this._status,
      completionRecord: this._completionRecord?.toClientDTO() ?? null,
      skipRecord: this._skipRecord?.toClientDTO() ?? null,
      actualStartTime: this._actualStartTime,
      actualEndTime: this._actualEndTime,
      note: this._note,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      instanceDateFormatted,
      statusText,
      statusColor,
      isCompleted: this._status === 'COMPLETED',
      isSkipped: this._status === 'SKIPPED',
      isPending: this._status === 'PENDING',
      isExpired: this._status === 'EXPIRED',
      hasNote: this._note !== null,
      actualDuration,
      durationText,
      formattedCreatedAt: new Date(this._createdAt).toLocaleString('zh-CN'),
      formattedUpdatedAt: new Date(this._updatedAt).toLocaleString('zh-CN'),
    };
  }

  public toPersistenceDTO(): TaskInstancePersistenceDTO {
    return {
      id: this.id,
      templateId: this._templateId,
      identityId: this._identityId,
      instanceDate: this._instanceDate,
      timeConfig: JSON.stringify(this._timeConfig.toPersistenceDTO()),
      importance: this._importance,
      priority: this._priority,
      status: this._status,
      completionRecord: this._completionRecord
        ? JSON.stringify(this._completionRecord.toPersistenceDTO())
        : null,
      skipRecord: this._skipRecord ? JSON.stringify(this._skipRecord.toPersistenceDTO()) : null,
      actualStartTime: this._actualStartTime,
      actualEndTime: this._actualEndTime,
      note: this._note,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  // ===== 4. 工厂方法 (Factories) =====

  /**
   * 🏭 业务工厂：创建新的任务实例
   *
   * 注意：不再发布领域事件
   * 提醒由 ScheduleTask 统一管理（混合方案 C）
   */
  public static create(params: {
    templateId: TaskTemplateId;
    identityId: IdentityId;
    instanceDate: number;
    timeConfig: TaskTimeConfig;
    importance: ImportanceLevel;
  }): TaskInstance {
    const now = Date.now();
    const instance = new TaskInstance({
      templateId: params.templateId,
      identityId: params.identityId,
      instanceDate: params.instanceDate,
      timeConfig: params.timeConfig,
      importance: params.importance,
      status: 'PENDING' as TaskInstanceStatus,
      createdAt: now,
      updatedAt: now,
    });

    return instance;
  }

  /**
   * 🏭 恢复工厂：从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: TaskInstanceServerDTO): TaskInstance {
    return new TaskInstance({
      id: dto.id as TaskInstanceId,
      templateId: dto.templateId as TaskTemplateId,
      identityId: dto.identityId as IdentityId,
      instanceDate: dto.instanceDate,
      timeConfig: TaskTimeConfig.fromServerDTO(dto.timeConfig),
      importance: dto.importance,
      priority: dto.priority,
      status: dto.status,
      completionRecord: dto.completionRecord
        ? CompletionRecord.fromServerDTO(dto.completionRecord, dto.uuid)
        : null,
      skipRecord: dto.skipRecord ? SkipRecord.fromServerDTO(dto.skipRecord) : null,
      actualStartTime: dto.actualStartTime,
      actualEndTime: dto.actualEndTime,
      note: dto.note,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 🏭 恢复工厂：从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: TaskInstancePersistenceDTO): TaskInstance {
    return new TaskInstance({
      id: dto.id as TaskInstanceId,
      templateId: dto.templateId as TaskTemplateId,
      identityId: dto.identityId as IdentityId,
      instanceDate: dto.instanceDate,
      timeConfig: TaskTimeConfig.fromPersistenceDTO(JSON.parse(dto.timeConfig as string)),
      importance: dto.importance as ImportanceLevel,
      priority: dto.priority,
      status: dto.status as TaskInstanceStatus,
      completionRecord: dto.completionRecord
        ? CompletionRecord.fromPersistenceDTO(JSON.parse(dto.completionRecord as string))
        : null,
      skipRecord: dto.skipRecord
        ? SkipRecord.fromPersistenceDTO(JSON.parse(dto.skipRecord as string))
        : null,
      actualStartTime: dto.actualStartTime,
      actualEndTime: dto.actualEndTime,
      note: dto.note,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ===== 辅助方法 =====

  private getStatusText(): string {
    const statusMap: Record<TaskInstanceStatus, string> = {
      PENDING: '待完成',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      SKIPPED: '已跳过',
      EXPIRED: '已过期',
    };
    return statusMap[this._status];
  }

  private getStatusColor(): string {
    const colorMap: Record<TaskInstanceStatus, string> = {
      PENDING: 'blue',
      IN_PROGRESS: 'orange',
      COMPLETED: 'green',
      SKIPPED: 'gray',
      EXPIRED: 'red',
    };
    return colorMap[this._status];
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
