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
import { GoalRecordId, KeyResultId } from '@dailyuse/domain-shared';
import type {
  GoalRecordPersistenceDTO,
  GoalRecordServer,
  GoalRecordServerDTO,
} from '@dailyuse/contracts/goal';

/**
 * GoalRecord 聚合根
 */
export class GoalRecord extends AggregateRoot<GoalRecordId> implements GoalRecordServer {
  // ================= 1. 内部状态 (Backing Fields) =================
  private _keyResultId: KeyResultId;
  private _value: number;
  private _note: string | null;
  private _recordedAt: Date;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. 构造函数 (Private) =================
  private constructor(props: GoalRecordServerDTO) {
    super(props.id);
    this._keyResultId = props.keyResultId;
    this._value = props.value;
    this._note = props.note ?? null;
    this._recordedAt = new Date(props.recordedAt);
    this._version = props.version ?? 1;
    this._createdAt = new Date(props.createdAt);
    this._updatedAt = new Date(props.updatedAt);
    this._deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;
  }

  // ================= 3. 公共属性 (Getters) =================
  get keyResultId(): KeyResultId {
    return this._keyResultId;
  }

  get value(): number {
    return this._value;
  }

  get note(): string | null {
    return this._note;
  }

  get recordedAt(): Date {
    return this._recordedAt;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
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
      recordedAt: params.recordedAt?.getTime() ?? now,
      version: 1,
      createdAt: now,
      updatedAt: now,
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
   * 🏭 恢复工厂：从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: GoalRecordServerDTO): GoalRecord {
    return new GoalRecord(dto);
  }

  /**
   * 🏭 恢复工厂：从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: GoalRecordPersistenceDTO): GoalRecord {
    const serverDTO: GoalRecordServerDTO = {
      id: dto.id,
      keyResultId: dto.keyResultId,
      value: dto.value,
      note: dto.note,
      recordedAt: dto.recordedAt.getTime(),
      version: dto.version,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
      deletedAt: dto.deletedAt?.getTime() ?? null,
    };
    return new GoalRecord(serverDTO);
  }

  // ================= 5. 业务行为 (Business Actions) =================

  /**
   * ✅ 更新备注
   */
  public updateNote(note: string): void {
    this._note = note.trim() || null;
    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * ✅ 软删除
   */
  public softDelete(): void {
    if (this._deletedAt) {
      return; // 已删除，幂等操作
    }
    this._deletedAt = new Date();
    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * ✅ 恢复软删除
   */
  public restore(): void {
    if (!this._deletedAt) {
      return; // 未删除，幂等操作
    }
    this._deletedAt = null;
    this._updatedAt = new Date();
    this._version++;
  }

  // ================= 6. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalRecordServerDTO {
    return {
      id: this.id,
      keyResultId: this._keyResultId,
      value: this._value,
      note: this._note,
      recordedAt: this._recordedAt.getTime(),
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(goalUuid?: string): import('@dailyuse/contracts/goal').GoalRecordClientDTO {
    return {
      uuid: this.id,
      keyResultUuid: this._keyResultId,
      goalUuid: goalUuid ?? '', // Will be populated by application service
      value: this._value,
      calculatedCurrentValue: this._value, // Current value as snapshot
      note: this._note,
      recordedAt: this._recordedAt.getTime(),
      createdAt: this._createdAt.getTime(),
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): GoalRecordPersistenceDTO {
    return {
      id: this.id,
      keyResultId: this._keyResultId,
      value: this._value,
      note: this._note,
      recordedAt: this._recordedAt,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
