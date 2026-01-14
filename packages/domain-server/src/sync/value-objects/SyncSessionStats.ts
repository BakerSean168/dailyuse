/**
 * SyncSessionStats 值对象
 * 同步会话统计信息
 */

import { ValueObject } from '@dailyuse/utils';
import {
  SyncableEntityType,
  type SyncSessionStatsDTO,
  type EntitySyncStats,
} from '@dailyuse/contracts/sync';

/**
 * SyncSessionStats 值对象
 *
 * 记录同步会话的统计数据
 */
export class SyncSessionStats extends ValueObject {
  public readonly totalEntities: number;
  public readonly successCount: number;
  public readonly failedCount: number;
  public readonly conflictCount: number;
  public readonly skippedCount: number;
  public readonly byEntityType: ReadonlyArray<EntitySyncStats>;
  public readonly bytesTransferred: number;
  public readonly durationMs: number;

  private constructor(params: SyncSessionStatsDTO) {
    super();
    this.totalEntities = params.totalEntities;
    this.successCount = params.successCount;
    this.failedCount = params.failedCount;
    this.conflictCount = params.conflictCount;
    this.skippedCount = params.skippedCount;
    this.byEntityType = Object.freeze([...params.byEntityType]);
    this.bytesTransferred = params.bytesTransferred;
    this.durationMs = params.durationMs;
    Object.freeze(this);
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建初始统计
   */
  static createInitial(): SyncSessionStats {
    return new SyncSessionStats({
      totalEntities: 0,
      successCount: 0,
      failedCount: 0,
      conflictCount: 0,
      skippedCount: 0,
      byEntityType: [],
      bytesTransferred: 0,
      durationMs: 0,
    });
  }

  /**
   * 从 DTO 创建
   */
  static fromDTO(dto: SyncSessionStatsDTO): SyncSessionStats {
    return new SyncSessionStats(dto);
  }

  // ===== 业务方法 =====

  /**
   * 添加实体统计
   */
  addEntityStats(stats: EntitySyncStats): SyncSessionStats {
    const existing = this.byEntityType.find(
      (s) => s.entityType === stats.entityType,
    );
    let newByEntityType: EntitySyncStats[];

    if (existing) {
      newByEntityType = this.byEntityType.map((s) =>
        s.entityType === stats.entityType
          ? {
              ...s,
              pushed: s.pushed + stats.pushed,
              pulled: s.pulled + stats.pulled,
              conflicts: s.conflicts + stats.conflicts,
              skipped: s.skipped + stats.skipped,
            }
          : s,
      );
    } else {
      newByEntityType = [...this.byEntityType, stats];
    }

    const totals = newByEntityType.reduce(
      (acc, s) => ({
        pushed: acc.pushed + s.pushed,
        pulled: acc.pulled + s.pulled,
        conflicts: acc.conflicts + s.conflicts,
        skipped: acc.skipped + s.skipped,
      }),
      { pushed: 0, pulled: 0, conflicts: 0, skipped: 0 },
    );

    return new SyncSessionStats({
      totalEntities: totals.pushed + totals.pulled,
      successCount: totals.pushed + totals.pulled - totals.skipped,
      failedCount: this.failedCount,
      conflictCount: totals.conflicts,
      skippedCount: totals.skipped,
      byEntityType: newByEntityType,
      bytesTransferred: this.bytesTransferred,
      durationMs: this.durationMs,
    });
  }

  /**
   * 增加成功计数
   */
  incrementSuccess(): SyncSessionStats {
    return new SyncSessionStats({
      ...this.toDTO(),
      successCount: this.successCount + 1,
      totalEntities: this.totalEntities + 1,
    });
  }

  /**
   * 增加失败计数
   */
  incrementFailed(): SyncSessionStats {
    return new SyncSessionStats({
      ...this.toDTO(),
      failedCount: this.failedCount + 1,
    });
  }

  /**
   * 增加冲突计数
   */
  incrementConflict(): SyncSessionStats {
    return new SyncSessionStats({
      ...this.toDTO(),
      conflictCount: this.conflictCount + 1,
    });
  }

  /**
   * 设置耗时
   */
  withDuration(durationMs: number): SyncSessionStats {
    return new SyncSessionStats({
      ...this.toDTO(),
      durationMs,
    });
  }

  /**
   * 是否有错误
   */
  get hasErrors(): boolean {
    return this.failedCount > 0;
  }

  /**
   * 是否有冲突
   */
  get hasConflicts(): boolean {
    return this.conflictCount > 0;
  }

  // ===== ValueObject 方法 =====

  equals(other: ValueObject): boolean {
    if (!(other instanceof SyncSessionStats)) return false;
    return (
      this.totalEntities === other.totalEntities &&
      this.successCount === other.successCount &&
      this.failedCount === other.failedCount &&
      this.conflictCount === other.conflictCount
    );
  }

  // ===== DTO 转换 =====

  toDTO(): SyncSessionStatsDTO {
    return {
      totalEntities: this.totalEntities,
      successCount: this.successCount,
      failedCount: this.failedCount,
      conflictCount: this.conflictCount,
      skippedCount: this.skippedCount,
      byEntityType: [...this.byEntityType],
      bytesTransferred: this.bytesTransferred,
      durationMs: this.durationMs,
    };
  }
}
