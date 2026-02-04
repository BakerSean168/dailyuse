/**
 * GoalRecord 聚合根实现 (Client)
 * 
 * 【规范说明：聚合根（Aggregate Root）】
 * 在客户端，我们保持与服务端相同的聚合根结构，以确保概念一致性
 */

import type { GoalRecordClient, GoalRecordClientDTO, GoalRecordServerDTO } from '@dailyuse/contracts/goal';
import { AggregateRoot } from '@dailyuse/utils';

export class GoalRecord extends AggregateRoot implements GoalRecordClient {
  private _keyResultUuid: string;
  private _goalUuid: string;
  private _value: number;
  private _calculatedCurrentValue?: number;
  private _note?: string | null;
  private _recordedAt: number;
  private _createdAt: number;

  private constructor(params: {
    uuid?: string;
    keyResultUuid: string;
    goalUuid: string;
    value: number;
    calculatedCurrentValue?: number;
    note?: string | null;
    recordedAt: number;
    createdAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._keyResultUuid = params.keyResultUuid;
    this._goalUuid = params.goalUuid;
    this._value = params.value;
    this._calculatedCurrentValue = params.calculatedCurrentValue;
    this._note = params.note;
    this._recordedAt = params.recordedAt;
    this._createdAt = params.createdAt;
  }

  // Getters
  public override get uuid(): string {
    return this._id;
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
  public get calculatedCurrentValue(): number | undefined {
    return this._calculatedCurrentValue;
  }
  public get note(): string | null | undefined {
    return this._note;
  }
  public get recordedAt(): number {
    return this._recordedAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }

  // UI 辅助属性
  public get formattedRecordedAt(): string {
    return new Date(this._recordedAt).toLocaleString('zh-CN');
  }

  public get formattedCreatedAt(): string {
    return new Date(this._createdAt).toLocaleString('zh-CN');
  }

  // 实体方法
  public getDisplayText(): string {
    return `记录值: ${this._value}`;
  }

  public getSummary(): string {
    const base = this.getDisplayText();
    if (this.hasNote()) {
      const notePreview =
        this._note!.length > 20 ? `${this._note!.substring(0, 20)}...` : this._note!;
      return `${base} - ${notePreview}`;
    }
    return base;
  }

  public hasNote(): boolean {
    return !!this._note && this._note.trim().length > 0;
  }

  // DTO 转换
  public toClientDTO(): GoalRecordClientDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      value: this._value,
      calculatedCurrentValue: this._calculatedCurrentValue,
      note: this._note,
      recordedAt: this._recordedAt,
      createdAt: this._createdAt,
      formattedRecordedAt: this.formattedRecordedAt,
      formattedCreatedAt: this.formattedCreatedAt,
    };
  }

  public toServerDTO(): GoalRecordServerDTO {
    return {
      uuid: this.uuid,
      keyResultUuid: this._keyResultUuid,
      goalUuid: this._goalUuid,
      value: this._value,
      note: this._note,
      recordedAt: this._recordedAt,
      createdAt: this._createdAt,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: GoalRecordClientDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      keyResultUuid: dto.keyResultUuid,
      goalUuid: dto.goalUuid,
      value: dto.value,
      calculatedCurrentValue: dto.calculatedCurrentValue,
      note: dto.note,
      recordedAt: dto.recordedAt,
      createdAt: dto.createdAt,
    });
  }

  public static fromServerDTO(dto: GoalRecordServerDTO): GoalRecord {
    return new GoalRecord({
      uuid: dto.uuid,
      keyResultUuid: dto.keyResultUuid,
      goalUuid: dto.goalUuid,
      value: dto.value,
      note: dto.note,
      recordedAt: dto.recordedAt,
      createdAt: dto.createdAt,
    });
  }

  public clone(): GoalRecord {
    return GoalRecord.fromClientDTO(this.toClientDTO());
  }
}
