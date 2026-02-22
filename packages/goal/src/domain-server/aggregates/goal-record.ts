/**
 * GoalRecord 聚合根
 * 目标记录聚合根
 *
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念，代表一个业务边界：
 * - 唯一标识：通过 ID 区分不同的聚合实例
 * - 事务边界：所有对聚合的修改在一个事务内完成
 * - 统一性：聚合保证内部状态的一致性
 * - 生命周期：聚合有创建、修改、删除的完整生命周期
 *
 * 【GoalRecord 职责】
 * - 记录关键成果的具体数值变更
 * - 追踪变更时间和备注原因
 * - 支持进度追踪（结合其他记录计算进度）
 *
 * 【同步支持】
 * - deletedAt: 软删除时间戳
 * - version: 乐观锁版本号
 * - updatedAt: 最后更新时间（增量同步）
 *
 * 【不变量（Invariants）】
 * 这些条件必须始终保持真：
 * - value 是有效数字
 * - recordedAt 不能早于 createdAt（理论上）
 * - keyResultId 必须存在
 */

import { AggregateRoot } from '@dailyuse/utils';
import { GoalRecordId, KeyResultId } from '../../domain-shared';
import type { GoalRecordServerDTO } from '@dailyuse/contracts/goal';

// 内部状态接口
export interface GoalRecordState {
  id: GoalRecordId;
  keyResultId: KeyResultId;
  value: number;
  note: string | null;
  recordedAt: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * GoalRecord 聚合根
 */
export class GoalRecord extends AggregateRoot<GoalRecordId> {
  // ================= 1. 内部状态 (Props) =================
  private _props: GoalRecordState;

  // ================= 2. 构造函数 (Private) =================
  private constructor(state: GoalRecordState) {
    super(state.id);
    this._props = {
      id: state.id,
      keyResultId: state.keyResultId,
      value: state.value,
      note: state.note ?? null,
      recordedAt: state.recordedAt,
      version: state.version ?? 1,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      deletedAt: state.deletedAt ?? null,
    };
  }

  // ================= 3. 公共属性 (Getters) =================
  get keyResultId(): KeyResultId {
    return this._props.keyResultId;
  }

  get value(): number {
    return this._props.value;
  }

  get note(): string | null {
    return this._props.note;
  }

  get recordedAt(): Date {
    return this._props.recordedAt;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // ================= 4. 工厂方法 (Factories) =================

  /**
   * 🏭 业务工厂：创建新的目标记录
   * @param params.id 可选，支持前端生成 ID
   */
  public static create(params: {
    id?: GoalRecordId;
    keyResultId: KeyResultId;
    value: number;
    note?: string;
    recordedAt?: Date;
  }): GoalRecord {
    // 验证
    if (!params.keyResultId) {
      throw new Error('KeyResult ID is required');
    }
    if (typeof params.value !== 'number' || isNaN(params.value)) {
      throw new Error('Value must be a valid number');
    }

    const now = Date.now();
    const id = params.id ?? GoalRecordId.generate();

    const record = new GoalRecord({
      id,
      keyResultId: params.keyResultId,
      value: params.value,
      note: params.note?.trim() || null,
      recordedAt: params.recordedAt ?? new Date(now),
      version: 1,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      deletedAt: null,
    });

    // 🎯 触发领域事件
    record.addDomainEvent('goal-record:created', {
      keyResultId: params.keyResultId,
      value: params.value,
      note: params.note || null,
    });

    return record;
  }

  /**
   * 🏭 恢复工厂：从状态恢复
   */
  public static load(state: GoalRecordState): GoalRecord {
    return new GoalRecord(state);
  }

  // ================= 5. 业务行为 (Business Actions) =================

  /**
   * ✅ 更新备注
   */
  public updateNote(note: string): void {
    this._props.note = note.trim() || null;
    this._props.updatedAt = new Date();
    this._props.version++;
  }

  /**
   * ✅ 软删除
   */
  public softDelete(): void {
    if (this._props.deletedAt) {
      return; // 已删除，幂等操作
    }
    this._props.deletedAt = new Date();
    this._props.updatedAt = new Date();
    this._props.version++;
  }

  /**
   * ✅ 恢复软删除
   */
  public restore(): void {
    if (!this._props.deletedAt) {
      return; // 未删除，幂等操作
    }
    this._props.deletedAt = null;
    this._props.updatedAt = new Date();
    this._props.version++;
  }

  // ================= 6. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalRecordServerDTO {
    return {
      id: this.id,
      keyResultId: this._props.keyResultId,
      value: this._props.value,
      note: this._props.note,
      recordedAt: this._props.recordedAt.getTime(),
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(goalId: string): import('@dailyuse/contracts/goal').GoalRecordClientDTO {
    return {
      id: this.id,
      keyResultId: this._props.keyResultId,
      goalId: goalId as import('@dailyuse/contracts/goal').GoalRecordClientDTO['goalId'],
      value: this._props.value,
      valueAfter: this._props.value, // Use value as snapshot for now
      comment: this._props.note,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }

}
