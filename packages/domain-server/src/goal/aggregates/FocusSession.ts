/**
 * FocusSession 聚合根实现
 * 实现 FocusSessionServer 接口
 *
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念，代表一个业务边界：
 * - 唯一标识：通过 UUID 区分不同的聚合实例
 * - 事务边界：所有对聚合的修改在一个事务内完成
 * - 统一性：聚合保证内部状态的一致性
 * - 生命周期：聚合有创建、修改、删除的完整生命周期
 *
 * 【FocusSession 职责】
 * 管理专注周期的完整生命周期：
 * - 状态机转换（DRAFT → IN_PROGRESS ↔ PAUSED → COMPLETED/CANCELLED）
 * - 时间追踪（开始、暂停、恢复、完成）
 * - 暂停统计（暂停次数、累计暂停时长）
 * - 实际时长计算（排除暂停时长）
 * - 进度计算
 *
 * 【不变量（Invariants）】
 * 这些条件必须始终保持真：
 * - durationMinutes > 0 且 <= 240（4 小时）
 * - actualDurationMinutes <= durationMinutes（考虑暂停时长）
 * - 软删除后不能再修改属性（只能恢复）
 */

import { AggregateRoot } from '@dailyuse/utils';
import { FocusSessionId, IdentityId, GoalId } from '@dailyuse/domain-shared';
import { FocusSessionStatus } from '@dailyuse/contracts/goal';
import type {
  FocusSessionPersistenceDTO,
  FocusSessionServer,
  FocusSessionServerDTO,
} from '@dailyuse/contracts/goal';

/**
 * FocusSession 聚合根
 */
export class FocusSession extends AggregateRoot<FocusSessionId> implements FocusSessionServer {
  // ================= 1. 内部状态 (Backing Fields) =================
  private _identityId: IdentityId;
  private _goalId: GoalId | null;
  private _status: FocusSessionStatus;
  private _durationMinutes: number; // 计划时长
  private _actualDurationMinutes: number; // 实际时长
  private _description: string | null;

  // 时间追踪
  private _startedAt: Date | null;
  private _pausedAt: Date | null;
  private _resumedAt: Date | null;
  private readonly _completedAt: Date | null;
  private _cancelledAt: Date | null;

  // 暂停统计
  private _pauseCount: number;
  private _pausedDurationMinutes: number; // 累计暂停时长

  private _createdAt: Date;
  private _updatedAt: Date;

  // ================= 2. 构造函数 (Private) =================
  private constructor(props: FocusSessionServerDTO) {
    super(props.id);
    this._identityId = props.identityId as IdentityId;
    this._goalId = (props.goalId ?? null) as GoalId | null;
    this._status = props.status;
    this._durationMinutes = props.durationMinutes;
    this._actualDurationMinutes = props.actualDurationMinutes;
    this._description = props.description ?? null;
    this._startedAt = props.startedAt ? new Date(props.startedAt) : null;
    this._pausedAt = props.pausedAt ? new Date(props.pausedAt) : null;
    this._resumedAt = props.resumedAt ? new Date(props.resumedAt) : null;
    this._completedAt = props.completedAt ? new Date(props.completedAt) : null;
    this._cancelledAt = props.cancelledAt ? new Date(props.cancelledAt) : null;
    this._pauseCount = props.pauseCount;
    this._pausedDurationMinutes = props.pausedDurationMinutes;
    this._createdAt = new Date(props.createdAt);
    this._updatedAt = new Date(props.updatedAt);
  }

  // ================= 3. 公共属性 (Getters) =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get goalId(): GoalId | null {
    return this._goalId;
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
  public get startedAt(): Date | null {
    return this._startedAt;
  }
  public get pausedAt(): Date | null {
    return this._pausedAt;
  }
  public get resumedAt(): Date | null {
    return this._resumedAt;
  }
  public get completedAt(): Date | null {
    return this._completedAt;
  }
  public get cancelledAt(): Date | null {
    return this._cancelledAt;
  }
  public get pauseCount(): number {
    return this._pauseCount;
  }
  public get pausedDurationMinutes(): number {
    return this._pausedDurationMinutes;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ================= 4. 工厂方法 (Factories) =================

  /**
   * 🏭 业务工厂：创建新的专注周期
   */
  public static create(params: {
    identityId: IdentityId;
    goalId?: GoalId | null;
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
    const id = FocusSessionId.generate();

    const session = new FocusSession({
      id,
      identityId: params.identityId,
      goalId: params.goalId ?? null,
      status: FocusSessionStatus.Active,
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

    session.addDomainEvent('focus-session:created', {
      id: id,
      identityId: params.identityId,
      goalId: params.goalId ?? null,
    });

    return session;
  }

  /**
   * 🏭 恢复工厂：从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: FocusSessionServerDTO): FocusSession {
    return new FocusSession(dto);
  }

  /**
   * 🏭 恢复工厂：从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: FocusSessionPersistenceDTO): FocusSession {
    const serverDTO: FocusSessionServerDTO = {
      id: dto.id,
      identityId: dto.identityId,
      goalId: dto.goalId ?? null,
      status: dto.status as FocusSessionStatus,
      durationMinutes: dto.durationMinutes,
      actualDurationMinutes: dto.actualDurationMinutes,
      description: dto.description,
      startedAt: dto.startedAt?.getTime() ?? null,
      pausedAt: dto.pausedAt?.getTime() ?? null,
      resumedAt: dto.resumedAt?.getTime() ?? null,
      completedAt: dto.completedAt?.getTime() ?? null,
      cancelledAt: dto.cancelledAt?.getTime() ?? null,
      pauseCount: dto.pauseCount,
      pausedDurationMinutes: dto.pausedDurationMinutes,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    };
    return new FocusSession(serverDTO);
  }

  // ================= 5. 业务行为 (Business Actions) =================

  /**
   * ✅ 开始专注周期
   */
  public start(): void {
    if (this._status !== FocusSessionStatus.Active) {
      throw new Error('只能从活跃状态开始专注周期');
    }

    const now = new Date();
    this._startedAt = now;
    this._updatedAt = now;

    this.addDomainEvent('focus-session:started', {
      id: this.id,
      identityId: this._identityId,
      startedAt: now.getTime(),
    });
  }

  /**
   * ✅ 暂停专注周期
   */
  public pause(): void {
    if (this._status !== FocusSessionStatus.Active) {
      throw new Error('只能暂停活跃的专注周期');
    }

    const now = new Date();
    this._pausedAt = now;
    this._pauseCount += 1;
    this._updatedAt = now;

    this.addDomainEvent('focus-session:paused', {
      id: this.id,
      identityId: this._identityId,
      pauseCount: this._pauseCount,
    });
  }

  /**
   * ✅ 恢复专注周期
   */
  public resume(): void {
    if (this._pausedAt === null) {
      throw new Error('专注周期未暂停，无法恢复');
    }

    const now = new Date();

    // 计算本次暂停时长（毫秒转分钟）
    const pauseDurationMs = now.getTime() - this._pausedAt.getTime();
    const pauseDurationMinutes = Math.round(pauseDurationMs / 1000 / 60);

    this._pausedDurationMinutes += pauseDurationMinutes;
    this._pausedAt = null;
    this._updatedAt = now;

    this.addDomainEvent('focus-session:resumed', {
      id: this.id,
      identityId: this._identityId,
      pausedDurationMinutes: this._pausedDurationMinutes,
    });
  }

  /**
   * ✅ 完成专注周期
   */
  public complete(): void {
    if (this._startedAt === null) {
      throw new Error('开始时间不存在，无法计算实际时长');
    }

    const now = new Date();

    // 如果处于暂停状态，先计算最后一次暂停的时长
    if (this._pausedAt !== null) {
      const lastPauseDurationMs = now.getTime() - this._pausedAt.getTime();
      const lastPauseDurationMinutes = Math.round(lastPauseDurationMs / 1000 / 60);
      this._pausedDurationMinutes += lastPauseDurationMinutes;
    }

    // 计算实际时长 = 总时长 - 暂停时长
    const totalDurationMs = now.getTime() - this._startedAt.getTime();
    const totalDurationMinutes = Math.round(totalDurationMs / 1000 / 60);
    this._actualDurationMinutes = Math.max(0, totalDurationMinutes - this._pausedDurationMinutes);

    this._status = FocusSessionStatus.Completed;
    this._pausedAt = null;
    this._updatedAt = now;

    this.addDomainEvent('focus-session:completed', {
      id: this.id,
      identityId: this._identityId,
      goalId: this._goalId,
      actualDurationMinutes: this._actualDurationMinutes,
      plannedDurationMinutes: this._durationMinutes,
    });
  }

  /**
   * ✅ 取消专注周期
   */
  public cancel(): void {
    if (this._status === FocusSessionStatus.Completed || this._status === FocusSessionStatus.Cancelled) {
      throw new Error('不能取消已完成或已取消的专注周期');
    }

    const now = new Date();
    this._status = FocusSessionStatus.Cancelled;
    this._cancelledAt = now;
    this._pausedAt = null;
    this._updatedAt = now;

    this.addDomainEvent('focus-session:cancelled', {
      id: this.id,
      identityId: this._identityId,
    });
  }

  /**
   * 📊 检查是否处于活跃状态
   */
  public isActive(): boolean {
    return this._status === FocusSessionStatus.Active;
  }

  /**
   * 📊 获取剩余时间（分钟）
   */
  public getRemainingMinutes(): number {
    if (this._status !== FocusSessionStatus.Active) {
      return 0;
    }

    if (this._startedAt === null) {
      return this._durationMinutes;
    }

    const now = Date.now();
    let elapsedMs: number;

    if (this._pausedAt !== null) {
      elapsedMs = this._pausedAt.getTime() - this._startedAt.getTime();
    } else {
      elapsedMs = now - this._startedAt.getTime();
    }

    const elapsedMinutes = Math.round(elapsedMs / 1000 / 60) - this._pausedDurationMinutes;
    const remaining = this._durationMinutes - elapsedMinutes;

    return Math.max(0, remaining);
  }

  // ================= 6. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): FocusSessionServerDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      goalId: this._goalId,
      status: this._status,
      durationMinutes: this._durationMinutes,
      actualDurationMinutes: this._actualDurationMinutes,
      description: this._description,
      startedAt: this._startedAt?.getTime() ?? null,
      pausedAt: this._pausedAt?.getTime() ?? null,
      resumedAt: this._resumedAt?.getTime() ?? null,
      completedAt: this._completedAt?.getTime() ?? null,
      cancelledAt: this._cancelledAt?.getTime() ?? null,
      pauseCount: this._pauseCount,
      pausedDurationMinutes: this._pausedDurationMinutes,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): FocusSessionPersistenceDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      goalId: this._goalId,
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
}
