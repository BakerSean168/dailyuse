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

// 内部状态接口
interface FocusSessionState {
  id: FocusSessionId;
  identityId: IdentityId;
  goalId: GoalId | null;
  status: FocusSessionStatus;
  durationMinutes: number;
  actualDurationMinutes: number;
  description: string | null;
  startedAt: Date | null;
  pausedAt: Date | null;
  resumedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  pauseCount: number;
  pausedDurationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  deletedAt: Date | null;
}

/**
 * FocusSession 聚合根
 */
export class FocusSession extends AggregateRoot<FocusSessionId> implements FocusSessionServer {
  // ================= 1. 内部状态 (Props) =================
  private _props: FocusSessionState;

  // ================= 2. 构造函数 (Private) =================
  private constructor(params: {
    id: FocusSessionId;
    identityId: IdentityId;
    goalId: GoalId | null;
    status: FocusSessionStatus;
    durationMinutes: number;
    actualDurationMinutes: number;
    description: string | null;
    startedAt: Date | null;
    pausedAt: Date | null;
    resumedAt: Date | null;
    completedAt: Date | null;
    cancelledAt: Date | null;
    pauseCount: number;
    pausedDurationMinutes: number;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._props = {
      id: params.id,
      identityId: params.identityId,
      goalId: params.goalId ?? null,
      status: params.status,
      durationMinutes: params.durationMinutes,
      actualDurationMinutes: params.actualDurationMinutes,
      description: params.description ?? null,
      startedAt: params.startedAt ?? null,
      pausedAt: params.pausedAt ?? null,
      resumedAt: params.resumedAt ?? null,
      completedAt: params.completedAt ?? null,
      cancelledAt: params.cancelledAt ?? null,
      pauseCount: params.pauseCount,
      pausedDurationMinutes: params.pausedDurationMinutes,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      version: params.version ?? 1,
      deletedAt: params.deletedAt ?? null,
    };
  }

  // ================= 3. 公共属性 (Getters) =================
  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get goalId(): GoalId | null {
    return this._props.goalId;
  }
  public get status(): FocusSessionStatus {
    return this._props.status;
  }
  public get durationMinutes(): number {
    return this._props.durationMinutes;
  }
  public get actualDurationMinutes(): number {
    return this._props.actualDurationMinutes;
  }
  public get description(): string | null {
    return this._props.description;
  }
  public get startedAt(): Date | null {
    return this._props.startedAt;
  }
  public get pausedAt(): Date | null {
    return this._props.pausedAt;
  }
  public get resumedAt(): Date | null {
    return this._props.resumedAt;
  }
  public get completedAt(): Date | null {
    return this._props.completedAt;
  }
  public get cancelledAt(): Date | null {
    return this._props.cancelledAt;
  }
  public get pauseCount(): number {
    return this._props.pauseCount;
  }
  public get pausedDurationMinutes(): number {
    return this._props.pausedDurationMinutes;
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
    // 不变量校验
    if (params.durationMinutes <= 0 || params.durationMinutes > 240) {
      throw new Error('专注时长必须在 1-240 分钟之间');
    }
    if (params.description && params.description.length > 500) {
      throw new Error('会话描述不能超过 500 个字符');
    }
    if (params.durationMinutes % 5 !== 0) {
      console.warn(`建议将专注时长设置为 5 分钟的倍数，当前值：${params.durationMinutes} 分钟`);
    }

    const now = new Date();
    const id = FocusSessionId.generate();

    const session = new FocusSession({
      id,
      identityId: params.identityId,
      goalId: params.goalId ?? null,
      status: FocusSessionStatus.Active,
      durationMinutes: params.durationMinutes,
      actualDurationMinutes: 0,
      description: params.description ?? null,
      startedAt: now,
      pausedAt: null,
      resumedAt: null,
      completedAt: null,
      cancelledAt: null,
      pauseCount: 0,
      pausedDurationMinutes: 0,
      createdAt: now,
      updatedAt: now,
      version: 1,
      deletedAt: null,
    });

    session.addDomainEvent('focus-session:created', {
      goalId: params.goalId ?? null,
    });

    return session;
  }

  /**
   * 🏭 恢复工厂：从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: FocusSessionServerDTO): FocusSession {
    return new FocusSession({
      id: FocusSessionId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      goalId: dto.goalId ? GoalId.of(dto.goalId) : null,
      status: dto.status,
      durationMinutes: dto.durationMinutes,
      actualDurationMinutes: dto.actualDurationMinutes,
      description: dto.description ?? null,
      startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
      pausedAt: dto.pausedAt ? new Date(dto.pausedAt) : null,
      resumedAt: dto.resumedAt ? new Date(dto.resumedAt) : null,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      cancelledAt: dto.cancelledAt ? new Date(dto.cancelledAt) : null,
      pauseCount: dto.pauseCount,
      pausedDurationMinutes: dto.pausedDurationMinutes,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      version: dto.version ?? 1,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  /**
   * 🏭 恢复工厂：从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: FocusSessionPersistenceDTO): FocusSession {
    return new FocusSession({
      id: FocusSessionId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      goalId: dto.goalId ? GoalId.of(dto.goalId) : null,
      status: dto.status as FocusSessionStatus,
      durationMinutes: dto.durationMinutes,
      actualDurationMinutes: dto.actualDurationMinutes,
      description: dto.description ?? null,
      startedAt: dto.startedAt ?? null,
      pausedAt: dto.pausedAt ?? null,
      resumedAt: dto.resumedAt ?? null,
      completedAt: dto.completedAt ?? null,
      cancelledAt: dto.cancelledAt ?? null,
      pauseCount: dto.pauseCount,
      pausedDurationMinutes: dto.pausedDurationMinutes,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      version: dto.version ?? 1,
      deletedAt: dto.deletedAt ?? null,
    });
  }

  // ================= 5. 业务行为 (Business Actions) =================

  /**
   * ✅ 开始专注周期
   */
  public start(): void {
    if (this._props.status !== FocusSessionStatus.Active) {
      throw new Error('只能从活跃状态开始专注周期');
    }

    if (this._props.startedAt !== null) {
      throw new Error('专注周期已开始');
    }

    const now = new Date();
    this._props.startedAt = now;
    this._props.updatedAt = now;

    this.addDomainEvent('focus-session:started', {});
  }

  /**
   * ✅ 暂停专注周期
   */
  public pause(): void {
    if (this._props.status !== FocusSessionStatus.Active) {
      throw new Error('只能暂停活跃的专注周期');
    }

    const now = new Date();
    this._props.pausedAt = now;
    this._props.pauseCount += 1;
    this._props.updatedAt = now;

    this.addDomainEvent('focus-session:paused', {});
  }

  /**
   * ✅ 恢复专注周期
   */
  public resume(): void {
    if (this._props.pausedAt === null) {
      throw new Error('专注周期未暂停，无法恢复');
    }

    const now = new Date();

    // 计算本次暂停时长（毫秒转分钟）
    const pauseDurationMs = now.getTime() - this._props.pausedAt.getTime();
    const pauseDurationMinutes = Math.round(pauseDurationMs / 1000 / 60);

    this._props.pausedDurationMinutes += pauseDurationMinutes;
    this._props.pausedAt = null;
    this._props.updatedAt = now;

    this.addDomainEvent('focus-session:resumed', {});
  }

  /**
   * ✅ 完成专注周期
   */
  public complete(): void {
    if (this._props.startedAt === null) {
      throw new Error('开始时间不存在，无法计算实际时长');
    }

    const now = new Date();

    // 如果处于暂停状态，先计算最后一次暂停的时长
    if (this._props.pausedAt !== null) {
      const lastPauseDurationMs = now.getTime() - this._props.pausedAt.getTime();
      const lastPauseDurationMinutes = Math.round(lastPauseDurationMs / 1000 / 60);
      this._props.pausedDurationMinutes += lastPauseDurationMinutes;
    }

    this._props.actualDurationMinutes = this.calculateActualDurationMinutes(now);

    this._props.status = FocusSessionStatus.Completed;
    this._props.pausedAt = null;
    this._props.updatedAt = now;

    this.addDomainEvent('focus-session:completed', {
      duration: this._props.actualDurationMinutes * 60 * 1000,
    });
  }

  /**
   * ✅ 取消专注周期
   */
  public cancel(): void {
    if (this._props.status === FocusSessionStatus.Completed || this._props.status === FocusSessionStatus.Cancelled) {
      throw new Error('不能取消已完成或已取消的专注周期');
    }

    const now = new Date();
    this._props.status = FocusSessionStatus.Cancelled;
    this._props.cancelledAt = now;
    this._props.pausedAt = null;
    this._props.updatedAt = now;

    this.addDomainEvent('focus-session:cancelled', {});
  }

  /**
   * 📊 检查是否处于活跃状态
   */
  public isActive(): boolean {
    return this._props.status === FocusSessionStatus.Active;
  }

  /**
   * 📊 校验会话所有权
   */
  public assertOwnedBy(identityId: IdentityId): void {
    if (this._props.identityId !== identityId) {
      throw new Error('无权操作此专注周期，会话不属于当前账户');
    }
  }

  /**
   * 📊 校验会话是否可删除
   */
  public assertDeletable(): void {
    if (
      this._props.status !== FocusSessionStatus.Completed &&
      this._props.status !== FocusSessionStatus.Cancelled
    ) {
      throw new Error(`只能删除已完成或已取消的专注周期，当前状态：${this._props.status}`);
    }
  }

  /**
   * 📊 获取暂停次数提醒
   */
  public getPauseWarning(maxRecommendedPauses = 3): string | null {
    if (this._props.pauseCount > maxRecommendedPauses) {
      return `当前暂停次数（${this._props.pauseCount}）超过推荐值（${maxRecommendedPauses}），可能影响专注效果`;
    }

    return null;
  }

  /**
   * 📊 获取剩余时间（分钟）
   */
  public getRemainingMinutes(): number {
    if (this._props.status !== FocusSessionStatus.Active) {
      return 0;
    }

    if (this._props.startedAt === null) {
      return this._props.durationMinutes;
    }

    const now = Date.now();
    let elapsedMs: number;

    if (this._props.pausedAt !== null) {
      elapsedMs = this._props.pausedAt.getTime() - this._props.startedAt.getTime();
    } else {
      elapsedMs = now - this._props.startedAt.getTime();
    }

    const elapsedMinutes = Math.round(elapsedMs / 1000 / 60) - this._props.pausedDurationMinutes;
    const remaining = this._props.durationMinutes - elapsedMinutes;

    return Math.max(0, remaining);
  }

  /**
   * 📊 剩余时间（分钟）
   */
  public get remainingMinutes(): number {
    return this.getRemainingMinutes();
  }

  /**
   * 📊 进度百分比（0-100）
   */
  public get progressPercentage(): number {
    if (
      this._props.status === FocusSessionStatus.Completed ||
      this._props.status === FocusSessionStatus.Cancelled
    ) {
      return 100;
    }

    if (this._props.durationMinutes === 0) {
      return 0;
    }

    const progress =
      ((this._props.durationMinutes - this.remainingMinutes) / this._props.durationMinutes) * 100;
    return Math.round(Math.max(0, Math.min(100, progress)));
  }

  private calculateActualDurationMinutes(completedAt: Date): number {
    const totalDurationMs = completedAt.getTime() - this._props.startedAt!.getTime();
    const totalDurationMinutes = Math.round(totalDurationMs / 1000 / 60);
    return Math.max(0, totalDurationMinutes - this._props.pausedDurationMinutes);
  }

  // ================= 6. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): FocusSessionServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      goalId: this._props.goalId,
      status: this._props.status,
      durationMinutes: this._props.durationMinutes,
      actualDurationMinutes: this._props.actualDurationMinutes,
      description: this._props.description,
      startedAt: this._props.startedAt?.getTime() ?? null,
      pausedAt: this._props.pausedAt?.getTime() ?? null,
      resumedAt: this._props.resumedAt?.getTime() ?? null,
      completedAt: this._props.completedAt?.getTime() ?? null,
      cancelledAt: this._props.cancelledAt?.getTime() ?? null,
      pauseCount: this._props.pauseCount,
      pausedDurationMinutes: this._props.pausedDurationMinutes,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      version: this._props.version,
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): import('@dailyuse/contracts/goal').FocusSessionClientDTO {
    const remainingMinutes = this.remainingMinutes;
    const progressPercentage = this.progressPercentage;

    return {
      id: this.id,
      identityId: this._props.identityId,
      goalId: this._props.goalId,
      status: this._props.status,
      durationMinutes: this._props.durationMinutes,
      actualDurationMinutes: this._props.actualDurationMinutes,
      description: this._props.description,
      startedAt: this._props.startedAt?.getTime() ?? null,
      pausedAt: this._props.pausedAt?.getTime() ?? null,
      resumedAt: this._props.resumedAt?.getTime() ?? null,
      completedAt: this._props.completedAt?.getTime() ?? null,
      cancelledAt: this._props.cancelledAt?.getTime() ?? null,
      pauseCount: this._props.pauseCount,
      pausedDurationMinutes: this._props.pausedDurationMinutes,
      remainingMinutes,
      progressPercentage,
      isActive: this._props.status === FocusSessionStatus.Active,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): FocusSessionPersistenceDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      goalId: this._props.goalId,
      status: this._props.status,
      durationMinutes: this._props.durationMinutes,
      actualDurationMinutes: this._props.actualDurationMinutes,
      description: this._props.description,
      startedAt: this._props.startedAt,
      pausedAt: this._props.pausedAt,
      resumedAt: this._props.resumedAt,
      completedAt: this._props.completedAt,
      cancelledAt: this._props.cancelledAt,
      pauseCount: this._props.pauseCount,
      pausedDurationMinutes: this._props.pausedDurationMinutes,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      version: this._props.version,
      deletedAt: this._props.deletedAt,
    };
  }
}
