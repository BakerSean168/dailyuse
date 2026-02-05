/**
 * SkipRecord 值对象实现 (Server)
 * 表示任务跳过记录
 */

import { ValueObject } from '@dailyuse/utils';

// Local DTO types (not yet defined in contracts)
interface SkipRecordServerDTO {
  skippedAt: number;
  reason: string | null;
}

interface SkipRecordPersistenceDTO {
  skipped_at: number;
  reason: string | null;
}

export class SkipRecord extends ValueObject<SkipRecordServerDTO> {
  private _skippedAt: number;
  private _reason: string | null;

  private constructor(params: { skippedAt: number; reason?: string | null }) {
    super({ skippedAt: params.skippedAt, reason: params.reason ?? null });
    this._skippedAt = params.skippedAt;
    this._reason = params.reason ?? null;
  }

  // ============ Getters ============

  public get skippedAt(): number {
    return this._skippedAt;
  }

  public get reason(): string | null {
    return this._reason;
  }

  // ============ Factory Methods ============

  public static create(params: {
    skippedAt?: number;
    reason?: string | null;
  }): SkipRecord {
    return new SkipRecord({
      skippedAt: params.skippedAt ?? Date.now(),
      reason: params.reason ?? null,
    });
  }

  public static fromDTO(dto: SkipRecordServerDTO): SkipRecord {
    return new SkipRecord({
      skippedAt: dto.skippedAt,
      reason: dto.reason,
    });
  }

  public static fromPersistence(dto: SkipRecordPersistenceDTO): SkipRecord {
    return new SkipRecord({
      skippedAt: dto.skipped_at,
      reason: dto.reason,
    });
  }

  // ============ Serialization ============

  public toDTO(): SkipRecordServerDTO {
    return {
      skippedAt: this._skippedAt,
      reason: this._reason,
    };
  }

  public toPersistence(): SkipRecordPersistenceDTO {
    return {
      skipped_at: this._skippedAt,
      reason: this._reason,
    };
  }
}
