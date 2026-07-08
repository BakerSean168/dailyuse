/**
 * GoalRecord Entity - Domain Client
 * 目标记录实体 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: GoalRecordState): GoalRecord
 * - Instance toDTO(): GoalRecordClientDTO
 */

import type { GoalRecordClientDTO } from '@dailyuse/contracts/goal';
import { Entity } from '@dailyuse/utils/domain';
import { GoalRecordId, KeyResultId, GoalId } from '../../server/domain';

export interface GoalRecordState {
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
}

export class GoalRecord extends Entity<GoalRecordId> {
  // ================= 1. Props =================
  private readonly _props: GoalRecordState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: GoalRecordState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get keyResultId(): KeyResultId {
    return this._props.keyResultId;
  }

  get goalId(): GoalId {
    return this._props.goalId;
  }

  get value(): number {
    return this._props.value;
  }

  get valueAfter(): number {
    return this._props.valueAfter;
  }

  get comment(): string | null {
    return this._props.comment;
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

  // 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  // ================= 4. Factory Methods =================
  public static load(state: GoalRecordState): GoalRecord {
    return new GoalRecord(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): GoalRecordClientDTO {
    return {
      id: String(this.id) as GoalRecordClientDTO['id'],
      keyResultId: String(this._props.keyResultId) as GoalRecordClientDTO['keyResultId'],
      goalId: String(this._props.goalId) as GoalRecordClientDTO['goalId'],
      value: this._props.value,
      valueAfter: this._props.valueAfter,
      comment: this._props.comment,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
    };
  }
}
