/**
 * GoalRecord 实体
 * 目标记录实体
 *
 * 【规范说明：实体（Entity）】
 * 实体与值对象的区别在于：
 * - 拥有唯一标识（通过 id）
 * - 可以改变状态
 * - 生命周期内身份保持不变（同一个 id）
 *
 * 【GoalRecord 职责】
 * - 记录关键成果的具体数值变更
 * - 追踪变更时间和备注原因
 * - 支持进度追踪（结合其他记录计算进度）
 *
 * 【不变量（Invariants）】
 * 这些条件必须始终保持真：
 * - value 是有效数字
 * - recordedAt 不能早于 createdAt（理论上）
 */

import { Entity } from '@dailyuse/utils';
import { GoalRecordId, GoalId, KeyResultId } from '@dailyuse/domain-shared';
import type {
  GoalRecordPersistenceDTO,
  GoalRecordServer,
  GoalRecordServerDTO,
} from '@dailyuse/contracts/goal';

/**
 * GoalRecord 实体
 */
export class GoalRecord extends Entity<GoalRecordId> implements GoalRecordServer {
  // ================= 1. 内部状态 (Backing Fields) =================
  private _keyResultId: KeyResultId;
  private _goalId: GoalId;
  private _value: number;
  private _note: string | null;
  private _recordedAt: Date;
  private _createdAt: Date;

  // ================= 2. 构造函数 (Private) =================
  private constructor(props: GoalRecordServerDTO) {
    super(props.uuid as GoalRecordId);
    this._keyResultId = props.keyResultUuid as KeyResultId;
    this._goalId = props.goalUuid as GoalId;
    this._value = props.value;
    this._note = props.note ?? null;
    this._recordedAt = new Date(props.recordedAt);
    this._createdAt = new Date(props.createdAt);
  }

  // ================= 3. 公共属性 (Getters) =================
  get keyResultUuid(): string {
    return this._keyResultId;
  }

  get goalUuid(): string {
    return this._goalId;
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

  get createdAt(): Date {
    return this._createdAt;
  }

  // ================= 4. 工厂方法 (Factories) =================

  /**
   * 🏭 业务工厂：创建新的目标记录
   */
  public static create(params: {
    keyResultId: KeyResultId;
    goalId: GoalId;
    value: number;
    note?: string;
    recordedAt?: number;
  }): GoalRecord {
    // 验证
    if (!params.keyResultId) {
      throw new Error('KeyResult ID is required');
    }
    if (!params.goalId) {
      throw new Error('Goal ID is required');
    }
    if (typeof params.value !== 'number' || isNaN(params.value)) {
      throw new Error('Value must be a valid number');
    }

    const now = Date.now();
    const uuid = Entity.generateUUID();

    return new GoalRecord({
      uuid,
      keyResultUuid: params.keyResultId,
      goalUuid: params.goalId,
      value: params.value,
      note: params.note?.trim() || null,
      recordedAt: params.recordedAt ?? now,
      createdAt: now,
    });
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
      uuid: dto.uuid,
      keyResultUuid: dto.keyResultUuid,
      goalUuid: dto.goalUuid,
      value: dto.value,
      note: dto.note,
      recordedAt: dto.recordedAt,
      createdAt: dto.createdAt.getTime(),
    };
    return new GoalRecord(serverDTO);
  }

  // ================= 5. 业务行为 (Business Actions) =================

  /**
   * ✅ 更新备注
   */
  public updateNote(note: string): void {
    this._note = note.trim() || null;
  }

  // ================= 6. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalRecordServerDTO {
    return {
      uuid: this.id as string,
      keyResultUuid: this._keyResultId,
      goalUuid: this._goalId,
      value: this._value,
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
      uuid: this.id as string,
      keyResultUuid: this._keyResultId,
      goalUuid: this._goalId,
      value: this._value,
      note: this._note,
      recordedAt: this._recordedAt.getTime(),
      createdAt: this._createdAt,
    };
  }
}
