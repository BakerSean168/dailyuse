import type { Instant } from '@memoflow/contracts/primitives';
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

import { AggregateRoot } from '@memoflow/utils/domain';
import { IdentityId } from '@memoflow/domain-shared';
import { FocusSessionId, GoalId } from '../value-objects';
import type { GoalEventMap } from '@memoflow/contracts/goal';
import { FocusSessionStatus } from '@memoflow/contracts/goal';
import type {
  FocusSessionServerDTO,
} from '@memoflow/contracts/goal';

// 内部状态接口
export interface FocusSessionState {
  id: FocusSessionId;
  identityId: IdentityId;
  goalId: GoalId | null;
  status: FocusSessionStatus;
  durationMinutes: number;
  actualDurationMinutes: number;
  description: string | null;
  startedAt: Instant | null;
  pausedAt: Instant | null;
  resumedAt: Instant | null;
  completedAt: Instant | null;
  cancelledAt: Instant | null;
  pauseCount: number;
  pausedDurationMinutes: number;
  createdAt: Instant;
  updatedAt: Instant;
  version: number;
  deletedAt: Instant | null;
}

/**
 * FocusSession 聚合根
 */
export class FocusSession extends AggregateRoot<FocusSessionId> {
  // ================= 1. 内部状态 (Props) =================
  private _props: FocusSessionState;

  // ================= 2. 构造函数 (Private) =================
  private constructor(state: FocusSessionState) {
    super(state.id);
    this._props = {
      id: state.id,
      identityId: state.identityId,
      goalId: state.goalId ?? null,
      status: state.status,
      durationMinutes: state.durationMinutes,
      actualDurationMinutes: state.actualDurationMinutes,
      description: state.description ?? null,
      startedAt: state.startedAt ?? null,
      pausedAt: state.pausedAt ?? null,
      resumedAt: state.resumedAt ?? null,
      completedAt: state.completedAt ?? null,
      cancelledAt: state.cancelledAt ?? null,
      pauseCount: state.pauseCount,
      pausedDurationMinutes: state.pausedDurationMinutes,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      version: state.version ?? 1,
      deletedAt: state.deletedAt ?? null,
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
  public get startedAt(): Instant | null {
    const v = this._props.startedAt;
    if (v == null) return null;
    return v as Instant;
  }
  public get pausedAt(): Instant | null {
    const v = this._props.pausedAt;
    if (v == null) return null;
    return v as Instant;
  }
  public get resumedAt(): Instant | null {
    const v = this._props.resumedAt;
    if (v == null) return null;
    return v as Instant;
  }
  public get completedAt(): Instant | null {
    const v = this._props.completedAt;
    if (v == null) return null;
    return v as Instant;
  }
  public get cancelledAt(): Instant | null {
    const v = this._props.cancelledAt;
    if (v == null) return null;
    return v as Instant;
  }
  public get pauseCount(): number {
    return this._props.pauseCount;
  }
  public get pausedDurationMinutes(): number {
    return this._props.pausedDurationMinutes;
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
  public get deletedAt(): Instant | null {
    const v = this._props.deletedAt;
    if (v == null) return null;
    return v as Instant;
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

    session.emitStarted();

    return session;
  }

  /**
   * 🏭 恢复工厂：从完整状态恢复实体
   */
  public static load(state: FocusSessionState): FocusSession {
    return new FocusSession(state);
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

    const now = Date.now();
    this._props.startedAt = now;
    this._props.updatedAt = now;

    this.emitStarted();
  }

  /**
   * ✅ 暂停专注周期
   */
  public pause(): void {
    if (this._props.status !== FocusSessionStatus.Active) {
      throw new Error('只能暂停活跃的专注周期');
    }
    if (this._props.pausedAt !== null) {
      throw new Error('专注周期已暂停');
    }

    const now = Date.now();
    this._props.pausedAt = now;
    this._props.pauseCount += 1;
    this._props.updatedAt = now;

    this.addDomainEvent<GoalEventMap['goal:focus-session-paused']>('goal:focus-session-paused', {
      identityId: this._props.identityId,
      sessionId: this.id,
      goalId: this._props.goalId,
      session: this.toServerDTO(),
      pausedAt: now,
      pauseCount: this._props.pauseCount,
    });
  }

  /**
   * ✅ 恢复专注周期
   */
  public resume(): void {
    if (this._props.pausedAt === null) {
      throw new Error('专注周期未暂停，无法恢复');
    }

    const now = Date.now();

    // 计算本次暂停时长（毫秒转分钟）
    const pauseDurationMs = now - this._props.pausedAt;
    const pauseDurationMinutes = Math.round(pauseDurationMs / 1000 / 60);

    this._props.pausedDurationMinutes += pauseDurationMinutes;
    this._props.pausedAt = null;
    this._props.resumedAt = now;
    this._props.updatedAt = now;

    this.addDomainEvent<GoalEventMap['goal:focus-session-resumed']>('goal:focus-session-resumed', {
      identityId: this._props.identityId,
      sessionId: this.id,
      goalId: this._props.goalId,
      session: this.toServerDTO(),
      resumedAt: now,
      pausedDurationMinutes: this._props.pausedDurationMinutes,
    });
  }

  /**
   * ✅ 完成专注周期
   */
  public complete(): void {
    if (this._props.startedAt === null) {
      throw new Error('开始时间不存在，无法计算实际时长');
    }

    const now = Date.now();

    // 如果处于暂停状态，先计算最后一次暂停的时长
    if (this._props.pausedAt !== null) {
      const lastPauseDurationMs = now - this._props.pausedAt;
      const lastPauseDurationMinutes = Math.round(lastPauseDurationMs / 1000 / 60);
      this._props.pausedDurationMinutes += lastPauseDurationMinutes;
    }

    this._props.actualDurationMinutes = this.calculateActualDurationMinutes(now);

    this._props.status = FocusSessionStatus.Completed;
    this._props.pausedAt = null;
    this._props.completedAt = now;
    this._props.updatedAt = now;

    this.addDomainEvent<GoalEventMap['goal:focus-session-completed']>('goal:focus-session-completed', {
      identityId: this._props.identityId,
      sessionId: this.id,
      goalId: this._props.goalId,
      session: this.toServerDTO(),
      completedAt: now,
      actualDurationMinutes: this._props.actualDurationMinutes,
      pausedDurationMinutes: this._props.pausedDurationMinutes,
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

    const now = Date.now();
    this._props.status = FocusSessionStatus.Cancelled;
    this._props.cancelledAt = now;
    this._props.pausedAt = null;
    this._props.updatedAt = now;

    this.addDomainEvent<GoalEventMap['goal:focus-session-cancelled']>('goal:focus-session-cancelled', {
      identityId: this._props.identityId,
      sessionId: this.id,
      goalId: this._props.goalId,
      session: this.toServerDTO(),
      cancelledAt: now,
    });
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
      elapsedMs = this._props.pausedAt - this._props.startedAt;
    } else {
      elapsedMs = now - this._props.startedAt;
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

  private emitStarted(): void {
    if (this._props.startedAt === null) {
      throw new Error('开始时间不存在，无法发送开始事件');
    }

    this.addDomainEvent<GoalEventMap['goal:focus-session-started']>('goal:focus-session-started', {
      identityId: this._props.identityId,
      sessionId: this.id,
      goalId: this._props.goalId,
      session: this.toServerDTO(),
      startedAt: this._props.startedAt,
    });
  }

  private calculateActualDurationMinutes(completedAt: Instant): number {
    const totalDurationMs = completedAt - this._props.startedAt!;
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
      startedAt: this._props.startedAt ?? null,
      pausedAt: this._props.pausedAt ?? null,
      resumedAt: this._props.resumedAt ?? null,
      completedAt: this._props.completedAt ?? null,
      cancelledAt: this._props.cancelledAt ?? null,
      pauseCount: this._props.pauseCount,
      pausedDurationMinutes: this._props.pausedDurationMinutes,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      version: this._props.version,
      deletedAt: this._props.deletedAt ?? null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): import('@memoflow/contracts/goal').FocusSessionClientDTO {
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
      startedAt: this._props.startedAt ?? null,
      pausedAt: this._props.pausedAt ?? null,
      resumedAt: this._props.resumedAt ?? null,
      completedAt: this._props.completedAt ?? null,
      cancelledAt: this._props.cancelledAt ?? null,
      pauseCount: this._props.pauseCount,
      pausedDurationMinutes: this._props.pausedDurationMinutes,
      remainingMinutes,
      progressPercentage,
      isActive: this._props.status === FocusSessionStatus.Active,
      version: this._props.version,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt ?? null,
    };
  }
}
