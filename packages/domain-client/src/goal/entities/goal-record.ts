/**
 * GoalRecord Entity - Domain Client
 * 目标记录实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 GoalRecordClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: GoalRecordClientDTO): GoalRecord
 * - Instance toDTO(): GoalRecordClientDTO
 */

import type {
  GoalRecordClient,
  GoalRecordClientDTO,
} from '@dailyuse/contracts/goal';
import { Entity } from '@dailyuse/utils';
import { GoalRecordId, KeyResultId, GoalId } from '@dailyuse/domain-shared/goal';

export class GoalRecord extends Entity<GoalRecordId> implements GoalRecordClient {
  // ================= 1. Backing Fields =================
  private _keyResultId: KeyResultId;
  private _goalId: GoalId;
  private _value: number;
  private _valueAfter: number;
  private _comment: string | null;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: GoalRecordId;
    keyResultId: KeyResultId;
    goalId: GoalId;
    value: number;
    valueAfter: number;
    comment: string | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._keyResultId = params.keyResultId;
    this._goalId = params.goalId;
    this._value = params.value;
    this._valueAfter = params.valueAfter;
    this._comment = params.comment;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 3. Getters =================
  get keyResultId(): KeyResultId {
    return this._keyResultId;
  }

  get goalId(): GoalId {
    return this._goalId;
  }

  get value(): number {
    return this._value;
  }

  get valueAfter(): number {
    return this._valueAfter;
  }

  get comment(): string | null {
    return this._comment;
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

  // 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: GoalRecordClientDTO): GoalRecord {
    return new GoalRecord({
      id: GoalRecordId.of(dto.id),
      keyResultId: KeyResultId.of(dto.keyResultId),
      goalId: GoalId.of(dto.goalId),
      value: dto.value,
      valueAfter: dto.valueAfter,
      comment: dto.comment,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): GoalRecordClientDTO {
    return {
      id: String(this.id) as GoalRecordClientDTO['id'],
      keyResultId: String(this._keyResultId) as GoalRecordClientDTO['keyResultId'],
      goalId: String(this._goalId) as GoalRecordClientDTO['goalId'],
      value: this._value,
      valueAfter: this._valueAfter,
      comment: this._comment,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
    };
  }
}
