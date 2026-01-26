/**
 * GoalRecord 实体
 * 目标记录实体
 *
 * DDD 实体职责：
 * - 记录关键成果的进度变更
 * - 追踪数值变化和变更原因
 */

import { Entity } from '@dailyuse/utils';
import type {
  GoalRecordClientDTO,
  GoalRecordPersistenceDTO,
  GoalRecordServer,
  GoalRecordServerDTO,
} from '@dailyuse/contracts/goal';

/**
 * GoalRecord 实体
 */
export class GoalRecord extends Entity implements GoalRecordServer {
  // ===== 私有字段 =====
  private _keyResultUuid: string; // ⚠️ 所属 KeyResult 的 UUID
  private _goalUuid: string; // ⚠️ 所属 Goal 的 UUID
  private _value: number; // 本次记录的值（独立值）
  private _note: string | null;
  private _recordedAt: Date;
  private _createdAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    keyResultUuid: string;
    goalUuid: string;
    value: number;
    note?: string | null;
    recordedAt: Date;
    createdAt: Date;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._keyResultUuid = params.keyResultUuid;
    this._goalUuid = params.goalUuid;
    this._value = params.value;
    this._note = params.note ?? null;
    this._recordedAt = params.recordedAt;
    this._createdAt = params.createdAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get keyResultUuid(): string {
    return this._keyResultUuid;
  }
  public get goalUuid(): string {
    return this._goalUuid;
  }
  public get value(): number {
    return this._value;
  }
  public get note(): string | null {
    return this._note;
  }
  public get recordedAt(): Date {
    return this._recordedAt;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 GoalRecord 实体
   */
  public static create(params: {
    keyResultUuid: string;
    goalUuid: string;
    value: number;
    note?: string;
    recordedAt?: number;
  }): GoalRecord {
    // 验证
    if (!params.keyResultUuid) {
      throw new Error('KeyResult UUID is required');
    }
    if (!params.goalUuid) {
      throw new Error('Goal UUID is required');
    }
    if (typeof params.value !== 'number' || isNaN(params.value)) {
      throw new Error('Value must be a valid number');
    }

    const now = new Date();

    return new GoalRecord({
      keyResultUuid: params.keyResultUuid,
      goalUuid: params.goalUuid,
      value: params.value,
      note: params.note?.trim() || null,
      recordedAt: params.recordedAt ? new Date(params.recordedAt) : now,
      createdAt: now,
    });
  }

  /**
   * 从 Server DTO 重建实体
   */
  public static fromServerDTO(dto: GoalRecordServerDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      keyResultUuid: dto.keyResultUuid,
      goalUuid: dto.goalUuid,
      value: dto.value,
      note: dto.note ?? null,
      recordedAt: new Date(dto.recordedAt),
      createdAt: new Date(dto.createdAt),
    });
  }

  /**
   * 从持久化 DTO 重建实体
   */
  public static fromPersistenceDTO(dto: GoalRecordPersistenceDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      keyResultUuid: dto.keyResultUuid,
      goalUuid: dto.goalUuid,
      value: dto.value,
      note: dto.note ?? null,
      recordedAt: new Date(dto.recordedAt),
      createdAt: new Date(dto.createdAt),
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新备注
   */
  public updateNote(note: string): void {
    this._note = note.trim() || null;
  }

  // ===== DTO 转换 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalRecordServerDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      value: this._value,
      note: this._note,
      recordedAt: this._recordedAt.getTime(),
      createdAt: this._createdAt.getTime(),
    };
  }

  public toClientDTO(calculatedCurrentValue?: number): GoalRecordClientDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      value: this._value,
      calculatedCurrentValue,
      note: this._note,
      recordedAt: this._recordedAt.getTime(),
      createdAt: this._createdAt.getTime(),
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): GoalRecordPersistenceDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      value: this._value,
      note: this._note,
      recordedAt: this._recordedAt.getTime(),
      createdAt: this._createdAt.getTime(),
    };
  }
}
