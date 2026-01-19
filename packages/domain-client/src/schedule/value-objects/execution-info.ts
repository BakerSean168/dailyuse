/**
 * ExecutionInfoClient 值对象
 * 执行信息 - 客户端值对象
 * 实现 IExecutionInfoClient 接口
 */

import type { ExecutionInfoClientDTO, ExecutionInfoServerDTO, IExecutionInfoClient } from '@dailyuse/contracts/schedule';
import { ExecutionStatus } from '@dailyuse/contracts/schedule';
import { ValueObject } from '@dailyuse/utils';

/**
 * ExecutionInfoClient 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class ExecutionInfo extends ValueObject implements IExecutionInfoClient {
  public readonly nextRunAt: Date | null;
  public readonly lastRunAt: Date | null;
  public readonly executionCount: number;
  public readonly lastExecutionStatus: ExecutionStatus | null;
  public readonly consecutiveFailures: number;

  // 私有字段（用于 DTO 转换，不在 Client 接口中）
  private readonly _lastExecutionDuration: number | null;

  constructor(params: {
    nextRunAt?: Date | null;
    lastRunAt?: Date | null;
    executionCount?: number;
    lastExecutionStatus?: ExecutionStatus | null;
    lastExecutionDuration?: number | null;
    consecutiveFailures?: number;
  }) {
    super();

    this.nextRunAt = params.nextRunAt ?? null;
    this.lastRunAt = params.lastRunAt ?? null;
    this.executionCount = params.executionCount ?? 0;
    this.lastExecutionStatus = params.lastExecutionStatus ?? null;
    this._lastExecutionDuration = params.lastExecutionDuration ?? null;
    this.consecutiveFailures = params.consecutiveFailures ?? 0;

    // 确保不可变
    Object.freeze(this);
  }

  // UI 辅助属性
  public get nextRunAtFormatted(): string | null {
    if (!this.nextRunAt) return null;
    return this.formatRelativeTime(this.nextRunAt.getTime());
  }

  public get lastRunAtFormatted(): string | null {
    if (!this.lastRunAt) return null;
    return this.formatRelativeTime(this.lastRunAt.getTime());
  }

  public get lastExecutionDurationFormatted(): string | null {
    if (this._lastExecutionDuration === null) return null;
    return this.formatDuration(this._lastExecutionDuration);
  }

  public get executionCountFormatted(): string {
    if (this.executionCount === 0) return '从未执行';
    return `已执行 ${this.executionCount} 次`;
  }

  public get healthStatus(): 'healthy' | 'warning' | 'critical' {
    if (this.consecutiveFailures === 0) return 'healthy';
    if (this.consecutiveFailures < 3) return 'warning';
    return 'critical';
  }

  private formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = timestamp - now;
    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diff > 0) {
      // 未来时间
      if (days > 0) return `${days}天后`;
      if (hours > 0) return `${hours}小时后`;
      if (minutes > 0) return `${minutes}分钟后`;
      return '即将执行';
    } else {
      // 过去时间
      if (days > 0) return `${days}天前`;
      if (hours > 0) return `${hours}小时前`;
      if (minutes > 0) return `${minutes}分钟前`;
      return '刚刚';
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}秒`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}分钟`;
    return `${Math.floor(ms / 3600000)}小时`;
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ExecutionInfo)) {
      return false;
    }

    return (
      this.nextRunAt?.getTime() === other.nextRunAt?.getTime() &&
      this.lastRunAt?.getTime() === other.lastRunAt?.getTime() &&
      this.executionCount === other.executionCount &&
      this.lastExecutionStatus === other.lastExecutionStatus &&
      this._lastExecutionDuration === other._lastExecutionDuration &&
      this.consecutiveFailures === other.consecutiveFailures
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ExecutionInfoServerDTO {
    return {
      nextRunAt: this.nextRunAt ? this.nextRunAt.toISOString() : null,
      lastRunAt: this.lastRunAt ? this.lastRunAt.toISOString() : null,
      executionCount: this.executionCount,
      lastExecutionStatus: this.lastExecutionStatus,
      lastExecutionDuration: this._lastExecutionDuration,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: ExecutionInfoServerDTO): ExecutionInfo {
    return new ExecutionInfo({
      nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : null,
      lastRunAt: dto.lastRunAt ? new Date(dto.lastRunAt) : null,
      executionCount: dto.executionCount,
      lastExecutionStatus: dto.lastExecutionStatus,
      lastExecutionDuration: dto.lastExecutionDuration,
      consecutiveFailures: dto.consecutiveFailures,
    });
  }

  /**
   * 从 Client DTO 创建值对象
   */
  public static fromClientDTO(dto: ExecutionInfoClientDTO): ExecutionInfo {
    return new ExecutionInfo({
      nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : null,
      lastRunAt: dto.lastRunAt ? new Date(dto.lastRunAt) : null,
      executionCount: dto.executionCount,
      lastExecutionStatus: dto.lastExecutionStatus,
      consecutiveFailures: dto.consecutiveFailures,
    });
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ExecutionInfoClientDTO {
    return {
      nextRunAt: this.nextRunAt ? this.nextRunAt.toISOString() : null,
      lastRunAt: this.lastRunAt ? this.lastRunAt.toISOString() : null,
      executionCount: this.executionCount,
      lastExecutionStatus: this.lastExecutionStatus,
      consecutiveFailures: this.consecutiveFailures,
      nextRunAtFormatted: this.nextRunAtFormatted,
      lastRunAtFormatted: this.lastRunAtFormatted,
      lastExecutionDurationFormatted: this.lastExecutionDurationFormatted,
      executionCountFormatted: this.executionCountFormatted,
      healthStatus: this.healthStatus,
    };
  }

  /**
   * 创建默认执行信息
   */
  public static createDefault(): ExecutionInfo {
    return new ExecutionInfo({
      nextRunAt: null,
      lastRunAt: null,
      executionCount: 0,
      lastExecutionStatus: null,
      lastExecutionDuration: null,
      consecutiveFailures: 0,
    });
  }
}
