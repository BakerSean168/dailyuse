/**
 * FocusSession 聚合根实现
 * 实现 FocusSessionServer 接口
 *
 * DDD 聚合根职责：
 * - 管理专注周期的状态机转换
 * - 执行时间追踪和暂停计算逻辑
 * - 确保聚合内的一致性
 * - 是事务边界
 */

import { AggregateRoot } from '@dailyuse/utils';
import {
  FocusSessionStatus,
} from '@dailyuse/contracts/goal';
import type {
  FocusSessionCancelledEvent,
  FocusSessionClientDTO,
  FocusSessionCompletedEvent,
  FocusSessionPausedEvent,
  FocusSessionPersistenceDTO,
  FocusSessionResumedEvent,
  FocusSessionServer,
  FocusSessionServerDTO,
  FocusSessionStartedEvent,
} from '@dailyuse/contracts/goal';

// 类型别名

/**
 * FocusSession 聚合根
 */
export class FocusSession extends AggregateRoot implements FocusSessionServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _goalUuid: string | null;
  private _status: FocusSessionStatus;
  private _durationMinutes: number; // 计划时长
  private _actualDurationMinutes: number; // 实际时长
  private _description: string | null;

  // 时间追踪
  private _startedAt: number | null; // timestamp (ms)
  private _pausedAt: number | null;
  private _resumedAt: number | null;
  private _completedAt: number | null;
  private _cancelledAt: number | null;

  // 暂停统计
  private _pauseCount: number;
  private _pausedDurationMinutes: number; // 累计暂停时长

  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    goalUuid?: string | null;
    status: FocusSessionStatus;
    durationMinutes: number;
    actualDurationMinutes: number;
    description?: string | null;
    startedAt?: number | null;
    pausedAt?: number | null;
    resumedAt?: number | null;
    completedAt?: number | null;
    cancelledAt?: number | null;
    pauseCount: number;
    pausedDurationMinutes: number;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._goalUuid = params.goalUuid ?? null;
    this._status = params.status;
    this._durationMinutes = params.durationMinutes;
    this._actualDurationMinutes = params.actualDurationMinutes;
    this._description = params.description ?? null;
    this._startedAt = params.startedAt ?? null;
    this._pausedAt = params.pausedAt ?? null;
    this._resumedAt = params.resumedAt ?? null;
    this._completedAt = params.completedAt ?? null;
    this._cancelledAt = params.cancelledAt ?? null;
    this._pauseCount = params.pauseCount;
    this._pausedDurationMinutes = params.pausedDurationMinutes;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get goalUuid(): string | null {
    return this._goalUuid;
  }
  public get status(): FocusSessionStatus {
    return this._status;
  }
  public get durationMinutes(): number {
    return this._durationMinutes;
  }
  public get actualDurationMinutes(): number {
    return this._actualDurationMinutes;
  }
  public get description(): string | null {
    return this._description;
  }
  public get startedAt(): number | null {
    return this._startedAt;
  }
  public get pausedAt(): number | null {
    return this._pausedAt;
  }
  public get resumedAt(): number | null {
    return this._resumedAt;
  }
  public get completedAt(): number | null {
    return this._completedAt;
  }
  public get cancelledAt(): number | null {
    return this._cancelledAt;
  }
  public get pauseCount(): number {
    return this._pauseCount;
  }
  public get pausedDurationMinutes(): number {
    return this._pausedDurationMinutes;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 静态工厂方法 =====
  /**
   * 创建新的专注周期
   */
  public static create(params: {
    accountUuid: string;
    goalUuid?: string | null;
    durationMinutes: number;
    description?: string | null;
  }): FocusSession {
    // 验证时长
    if (params.durationMinutes <= 0) {
      throw new Error('专注时长必须大于 0 分钟');
    }
    if (params.durationMinutes > 240) {
      throw new Error('专注时长不能超过 4 小时（240 分钟）');
    }

    const now = Date.now();

    return new FocusSession({
      accountUuid: params.accountUuid,
      goalUuid: params.goalUuid ?? null,
      status: FocusSessionStatus.DRAFT,
      durationMinutes: params.durationMinutes,
      actualDurationMinutes: 0,
      description: params.description ?? null,
      startedAt: null,
      pausedAt: null,
      resumedAt: null,
      completedAt: null,
      cancelledAt: null,
      pauseCount: 0,
      pausedDurationMinutes: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 业务方法 =====
  /**
   * 开始专注周期
   */
  public start(): void {
    if (this._status !== FocusSessionStatus.DRAFT) {
      throw new Error('只能从草稿状态开始专注周期');
    }

    const now = Date.now();
    this._status = FocusSessionStatus.IN_PROGRESS;
    this._startedAt = now;
    this._updatedAt = now;

    this.addDomainEvent({
      eventType: 'focus_session.started',
      aggregateId: this._uuid,
      occurredOn: new Date(now),
      payload: {
        sessionUuid: this._uuid,
        accountUuid: this._accountUuid,
        goalUuid: this._goalUuid,
        durationMinutes: this._durationMinutes,
        startedAt: now,
      },
    });
  }

  /**
   * 暂停专注周期
   */
  public pause(): void {
    if (this._status !== FocusSessionStatus.IN_PROGRESS) {
      throw new Error('只能暂停进行中的专注周期');
    }

    const now = Date.now();
    this._status = FocusSessionStatus.PAUSED;
    this._pausedAt = now;
    this._pauseCount += 1;
    this._updatedAt = now;

    this.addDomainEvent({
      eventType: 'focus_session.paused',
      aggregateId: this._uuid,
      occurredOn: new Date(now),
      payload: {
        sessionUuid: this._uuid,
        accountUuid: this._accountUuid,
        pausedAt: now,
        pauseCount: this._pauseCount,
      },
    });
  }

  /**
   * 恢复专注周期
   */
  public resume(): void {
    if (this._status !== FocusSessionStatus.PAUSED) {
      throw new Error('只能恢复已暂停的专注周期');
    }
    if (this._pausedAt === null) {
      throw new Error('暂停时间不存在，无法计算暂停时长');
    }

    const now = Date.now();

    // 计算本次暂停时长（毫秒转分钟）
    const pauseDurationMs = now - this._pausedAt;
    const pauseDurationMinutes = Math.round(pauseDurationMs / 1000 / 60);

    this._status = FocusSessionStatus.IN_PROGRESS;
    this._resumedAt = now;
    this._pausedDurationMinutes += pauseDurationMinutes;
    this._pausedAt = null; // 清除暂停时间
    this._updatedAt = now;

    this.addDomainEvent({
      eventType: 'focus_session.resumed',
      aggregateId: this._uuid,
      occurredOn: new Date(now),
      payload: {
        sessionUuid: this._uuid,
        accountUuid: this._accountUuid,
        resumedAt: now,
        pausedDurationMinutes: this._pausedDurationMinutes,
      },
    });
  }

  /**
   * 完成专注周期
   */
  public complete(): void {
    if (
      this._status !== FocusSessionStatus.IN_PROGRESS &&
      this._status !== FocusSessionStatus.PAUSED
    ) {
      throw new Error('只能完成进行中或已暂停的专注周期');
    }
    if (this._startedAt === null) {
      throw new Error('开始时间不存在，无法计算实际时长');
    }

    const now = Date.now();

    // 如果处于暂停状态，先计算最后一次暂停的时长
    if (this._status === FocusSessionStatus.PAUSED && this._pausedAt !== null) {
      const lastPauseDurationMs = now - this._pausedAt;
      const lastPauseDurationMinutes = Math.round(lastPauseDurationMs / 1000 / 60);
      this._pausedDurationMinutes += lastPauseDurationMinutes;
    }

    // 计算实际时长 = 总时长 - 暂停时长
    const totalDurationMs = now - this._startedAt;
    const totalDurationMinutes = Math.round(totalDurationMs / 1000 / 60);
    this._actualDurationMinutes = totalDurationMinutes - this._pausedDurationMinutes;

    // 确保实际时长不为负数
    if (this._actualDurationMinutes < 0) {
      this._actualDurationMinutes = 0;
    }

    this._status = FocusSessionStatus.COMPLETED;
    this._completedAt = now;
    this._pausedAt = null; // 清除暂停时间
    this._updatedAt = now;

    this.addDomainEvent({
      eventType: 'focus_session.completed',
      aggregateId: this._uuid,
      occurredOn: new Date(now),
      payload: {
        sessionUuid: this._uuid,
        accountUuid: this._accountUuid,
        goalUuid: this._goalUuid,
        completedAt: now,
        actualDurationMinutes: this._actualDurationMinutes,
        plannedDurationMinutes: this._durationMinutes,
      },
    });
  }

  /**
   * 取消专注周期
   */
  public cancel(): void {
    if (
      this._status === FocusSessionStatus.COMPLETED ||
      this._status === FocusSessionStatus.CANCELLED
    ) {
      throw new Error('不能取消已完成或已取消的专注周期');
    }

    const now = Date.now();
    this._status = FocusSessionStatus.CANCELLED;
    this._cancelledAt = now;
    this._pausedAt = null; // 清除暂停时间
    this._updatedAt = now;

    this.addDomainEvent({
      eventType: 'focus_session.cancelled',
      aggregateId: this._uuid,
      occurredOn: new Date(now),
      payload: {
        sessionUuid: this._uuid,
        accountUuid: this._accountUuid,
        cancelledAt: now,
        reason: null,
      },
    });
  }

  /**
   * 检查是否处于活跃状态（进行中或暂停）
   */
  public isActive(): boolean {
    return (
      this._status === FocusSessionStatus.IN_PROGRESS || this._status === FocusSessionStatus.PAUSED
    );
  }

  /**
   * 获取剩余时间（分钟）
   */
  public getRemainingMinutes(): number {
    if (this._status === FocusSessionStatus.DRAFT) {
      return this._durationMinutes;
    }

    if (
      this._status === FocusSessionStatus.COMPLETED ||
      this._status === FocusSessionStatus.CANCELLED
    ) {
      return 0;
    }

    if (this._startedAt === null) {
      return this._durationMinutes;
    }

    const now = Date.now();
    let elapsedMs: number;

    if (this._status === FocusSessionStatus.IN_PROGRESS) {
      // 进行中：当前时间 - 开始时间 - 累计暂停时长
      elapsedMs = now - this._startedAt;
    } else if (this._status === FocusSessionStatus.PAUSED && this._pausedAt !== null) {
      // 已暂停：暂停时间 - 开始时间
      elapsedMs = this._pausedAt - this._startedAt;
    } else {
      return this._durationMinutes;
    }

    // 转换为分钟，减去暂停时长
    const elapsedMinutes = Math.round(elapsedMs / 1000 / 60) - this._pausedDurationMinutes;
    const remaining = this._durationMinutes - elapsedMinutes;

    return Math.max(0, remaining);
  }

  // ===== DTO 转换方法 =====
  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): FocusSessionServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      goalUuid: this._goalUuid,
      status: this._status,
      durationMinutes: this._durationMinutes,
      actualDurationMinutes: this._actualDurationMinutes,
      description: this._description,
      startedAt: this._startedAt,
      pausedAt: this._pausedAt,
      resumedAt: this._resumedAt,
      completedAt: this._completedAt,
      cancelledAt: this._cancelledAt,
      pauseCount: this._pauseCount,
      pausedDurationMinutes: this._pausedDurationMinutes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为 ClientDTO
   */
  public toClientDTO(): FocusSessionClientDTO {
    const remaining = this.getRemainingMinutes();
    const progressPercentage =
      this._durationMinutes > 0
        ? Math.round(((this._durationMinutes - remaining) / this._durationMinutes) * 100)
        : 0;

    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      goalUuid: this._goalUuid,
      status: this._status,
      durationMinutes: this._durationMinutes,
      actualDurationMinutes: this._actualDurationMinutes,
      description: this._description,
      startedAt: this._startedAt,
      pausedAt: this._pausedAt,
      resumedAt: this._resumedAt,
      completedAt: this._completedAt,
      cancelledAt: this._cancelledAt,
      pauseCount: this._pauseCount,
      pausedDurationMinutes: this._pausedDurationMinutes,
      remainingMinutes: remaining,
      progressPercentage: progressPercentage,
      isActive: this.isActive(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): FocusSessionPersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      goalUuid: this._goalUuid,
      status: this._status,
      durationMinutes: this._durationMinutes,
      actualDurationMinutes: this._actualDurationMinutes,
      description: this._description,
      startedAt: this._startedAt,
      pausedAt: this._pausedAt,
      resumedAt: this._resumedAt,
      completedAt: this._completedAt,
      cancelledAt: this._cancelledAt,
      pauseCount: this._pauseCount,
      pausedDurationMinutes: this._pausedDurationMinutes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== 静态方法：从 DTO 重建聚合根 =====
  /**
   * 从 ServerDTO 重建聚合根
   */
  public static fromServerDTO(dto: FocusSessionServerDTO): FocusSession {
    return new FocusSession({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      goalUuid: dto.goalUuid,
      status: dto.status,
      durationMinutes: dto.durationMinutes,
      actualDurationMinutes: dto.actualDurationMinutes,
      description: dto.description,
      startedAt: dto.startedAt,
      pausedAt: dto.pausedAt,
      resumedAt: dto.resumedAt,
      completedAt: dto.completedAt,
      cancelledAt: dto.cancelledAt,
      pauseCount: dto.pauseCount,
      pausedDurationMinutes: dto.pausedDurationMinutes,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 ClientDTO 重建聚合根
   */
  public static fromClientDTO(dto: FocusSessionClientDTO): FocusSession {
    return new FocusSession({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      goalUuid: dto.goalUuid,
      status: dto.status,
      durationMinutes: dto.durationMinutes,
      actualDurationMinutes: dto.actualDurationMinutes,
      description: dto.description,
      startedAt: dto.startedAt,
      pausedAt: dto.pausedAt,
      resumedAt: dto.resumedAt,
      completedAt: dto.completedAt,
      cancelledAt: dto.cancelledAt,
      pauseCount: dto.pauseCount,
      pausedDurationMinutes: dto.pausedDurationMinutes,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 PersistenceDTO 重建聚合根
   */
  public static fromPersistenceDTO(dto: FocusSessionPersistenceDTO): FocusSession {
    return new FocusSession({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      goalUuid: dto.goalUuid,
      status: dto.status as FocusSessionStatus,
      durationMinutes: dto.durationMinutes,
      actualDurationMinutes: dto.actualDurationMinutes,
      description: dto.description,
      startedAt: dto.startedAt,
      pausedAt: dto.pausedAt,
      resumedAt: dto.resumedAt,
      completedAt: dto.completedAt,
      cancelledAt: dto.cancelledAt,
      pauseCount: dto.pauseCount,
      pausedDurationMinutes: dto.pausedDurationMinutes,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
