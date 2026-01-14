/**
 * ConflictResolution 值对象 (Client)
 * 冲突解决记录
 */

import { ValueObject } from '@dailyuse/utils';
import {
  ConflictResolutionStrategy,
  type ConflictResolutionDTO,
} from '@dailyuse/contracts/sync';

/**
 * ConflictResolution 值对象
 */
export class ConflictResolution extends ValueObject {
  public readonly strategy: ConflictResolutionStrategy;
  public readonly selectedVersion: 'local' | 'remote' | 'merged';
  public readonly resolvedData?: unknown;
  public readonly resolvedAt: number;
  public readonly resolvedBy: string;

  private constructor(params: ConflictResolutionDTO) {
    super();
    this.strategy = params.strategy;
    this.selectedVersion = params.selectedVersion;
    this.resolvedData = params.resolvedData;
    this.resolvedAt = params.resolvedAt;
    this.resolvedBy = params.resolvedBy;
  }

  // ===== 静态工厂方法 =====

  static fromDTO(dto: ConflictResolutionDTO): ConflictResolution {
    return new ConflictResolution(dto);
  }

  // ===== UI 辅助属性 =====

  /**
   * 策略显示文本
   */
  get strategyDisplay(): string {
    const map: Record<ConflictResolutionStrategy, string> = {
      [ConflictResolutionStrategy.LOCAL_WINS]: '本地优先',
      [ConflictResolutionStrategy.REMOTE_WINS]: '远程优先',
      [ConflictResolutionStrategy.LATEST_WINS]: '最新优先',
      [ConflictResolutionStrategy.VECTOR_CLOCK]: '向量时钟',
      [ConflictResolutionStrategy.MANUAL]: '手动解决',
    };
    return map[this.strategy];
  }

  /**
   * 选择版本显示文本
   */
  get selectedVersionDisplay(): string {
    const map: Record<string, string> = {
      local: '本地版本',
      remote: '远程版本',
      merged: '合并版本',
    };
    return map[this.selectedVersion];
  }

  /**
   * 解决时间格式化
   */
  get resolvedAtFormatted(): string {
    return new Date(this.resolvedAt).toLocaleString();
  }

  /**
   * 解决时间相对描述
   */
  get resolvedAtRelative(): string {
    const now = Date.now();
    const diff = now - this.resolvedAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小时前`;
    if (minutes > 0) return `${minutes} 分钟前`;
    return '刚刚';
  }

  /**
   * 是否为自动解决
   */
  get isAutoResolved(): boolean {
    return this.strategy !== ConflictResolutionStrategy.MANUAL;
  }

  // ===== ValueObject 方法 =====

  override equals(other: ValueObject): boolean {
    if (!(other instanceof ConflictResolution)) return false;
    return (
      this.strategy === other.strategy &&
      this.selectedVersion === other.selectedVersion &&
      this.resolvedAt === other.resolvedAt
    );
  }

  // ===== DTO 转换 =====

  toDTO(): ConflictResolutionDTO {
    return {
      strategy: this.strategy,
      selectedVersion: this.selectedVersion,
      resolvedData: this.resolvedData,
      resolvedAt: this.resolvedAt,
      resolvedBy: this.resolvedBy,
    };
  }
}
