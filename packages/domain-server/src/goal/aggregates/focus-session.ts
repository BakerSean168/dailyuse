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
 * FocusSession 属性接口
 */
interface FocusSessionProps {
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
  private _props: FocusSessionProps;

  // ================= 2. 构造函数 (Private) =================
  private constructor(props: FocusSessionServerDTO) {
    super(props.id);
    this._props = {
      identityId: props.identityId as IdentityId,
      goalId: (props.goalId ?? null) as GoalId | null,
      status: props.status,
      durationMinutes: props.durationMinutes,
      actualDurationMinutes: props.actualDurationMinutes,
      description: props.description ?? null,
      startedAt: props.startedAt ? new Date(props.startedAt) : null,
      pausedAt: props.pausedAt ? new Date(props.pausedAt) : null,
      resumedAt: props.resumedAt ? new Date(props.resumedAt) : null,
      completedAt: props.completedAt ? new Date(props.completedAt) : null,
      cancelledAt: props.cancelledAt ? new Date(props.cancelledAt) : null,
      pauseCount: props.pauseCount,
      pausedDurationMinutes: props.pausedDurationMinutes,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
      version: props.version ?? 1,
      deletedAt: props.deletedAt ? new Date(props.deletedAt) : null,
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
      version: dto.version ?? 1,
      deletedAt: dto.deletedAt?.getTime() ?? null,
    };
    return new FocusSession(serverDTO);
  }

  // ================= 5. 业务行为 (Business Actions) =================

  /**
   * ✅ 开始专注周期
   */
  public start(): void {
    if (this._props.status !== FocusSessionStatus.Active) {
      throw new Error('只能从活跃状态开始专注周期');
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

    // 计算实际时长 = 总时长 - 暂停时长
    const totalDurationMs = now.getTime() - this._props.startedAt.getTime();
    const totalDurationMinutes = Math.round(totalDurationMs / 1000 / 60);
    this._props.actualDurationMinutes = Math.max(0, totalDurationMinutes - this._props.pausedDurationMinutes);

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
    const remainingMinutes = this.getRemainingMinutes();
    const progressPercentage = this._props.durationMinutes > 0
      ? Math.min(100, Math.round(((this._props.durationMinutes - remainingMinutes) / this._props.durationMinutes) * 100))
      : 0;

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
