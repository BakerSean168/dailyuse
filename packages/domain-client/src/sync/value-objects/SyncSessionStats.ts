/**
 * SyncSessionStats 值对象 (Client)
 * 同步会话统计
 */

import { ValueObject } from '@dailyuse/utils';
import type { SyncSessionStatsDTO, EntitySyncStats } from '@dailyuse/contracts/sync';

/**
 * SyncSessionStats 值对象
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
  }

  // ===== 静态工厂方法 =====

  static fromDTO(dto: SyncSessionStatsDTO): SyncSessionStats {
    return new SyncSessionStats(dto);
  }

  // ===== UI 辅助属性 =====

  /**
   * 成功率
   */
  get successRate(): number {
    if (this.totalEntities === 0) return 100;
    return Math.round((this.successCount / this.totalEntities) * 100);
  }

  /**
   * 成功率显示
   */
  get successRateDisplay(): string {
    return `${this.successRate}%`;
  }

  /**
   * 处理总数显示
   */
  get processedDisplay(): string {
    return `${this.successCount}/${this.totalEntities}`;
  }

  /**
   * 传输大小格式化
   */
  get bytesTransferredDisplay(): string {
    if (this.bytesTransferred < 1024) {
      return `${this.bytesTransferred} B`;
    }
    if (this.bytesTransferred < 1024 * 1024) {
      return `${(this.bytesTransferred / 1024).toFixed(1)} KB`;
    }
    return `${(this.bytesTransferred / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * 耗时格式化
   */
  get durationDisplay(): string {
    if (this.durationMs < 1000) {
      return `${this.durationMs} ms`;
    }
    if (this.durationMs < 60000) {
      return `${(this.durationMs / 1000).toFixed(1)} 秒`;
    }
    const minutes = Math.floor(this.durationMs / 60000);
    const seconds = Math.floor((this.durationMs % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
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

  /**
   * 状态标签
   */
  get statusLabel(): 'success' | 'warning' | 'error' {
    if (this.failedCount > 0) return 'error';
    if (this.conflictCount > 0 || this.skippedCount > 0) return 'warning';
    return 'success';
  }

  /**
   * 状态颜色
   */
  get statusColor(): string {
    const colorMap = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    };
    return colorMap[this.statusLabel];
  }

  // ===== ValueObject 方法 =====

  override equals(other: ValueObject): boolean {
    if (!(other instanceof SyncSessionStats)) return false;
    return (
      this.totalEntities === other.totalEntities &&
      this.successCount === other.successCount &&
      this.failedCount === other.failedCount &&
      this.durationMs === other.durationMs
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
