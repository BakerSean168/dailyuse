/**
 * SyncProfileConfig 值对象 (Client)
 * 同步配置
 */

import { ValueObject } from '@dailyuse/utils';
import {
  SyncDirection,
  SyncStrategy,
  ConflictResolutionStrategy,
  SyncableEntityType,
  type SyncProfileConfigDTO,
  type AutoSyncConfigDTO,
  type SyncFilterConfigDTO,
} from '@dailyuse/contracts/sync';

/**
 * SyncProfileConfig 值对象
 */
export class SyncProfileConfig extends ValueObject {
  public readonly direction: SyncDirection;
  public readonly strategy: SyncStrategy;
  public readonly conflictStrategy: ConflictResolutionStrategy;
  public readonly autoSync: AutoSyncConfigDTO;
  public readonly filter: SyncFilterConfigDTO;
  public readonly compress: boolean;
  public readonly encrypt: boolean;

  private constructor(params: SyncProfileConfigDTO) {
    super();
    this.direction = params.direction;
    this.strategy = params.strategy;
    this.conflictStrategy = params.conflictStrategy;
    this.autoSync = { ...params.autoSync };
    this.filter = {
      ...params.filter,
      entityTypes: [...params.filter.entityTypes],
    };
    this.compress = params.compress;
    this.encrypt = params.encrypt;
  }

  // ===== 静态工厂方法 =====

  static fromDTO(dto: SyncProfileConfigDTO): SyncProfileConfig {
    return new SyncProfileConfig(dto);
  }

  // ===== UI 辅助属性 =====

  /**
   * 同步方向显示文本
   */
  get directionDisplay(): string {
    const map: Record<SyncDirection, string> = {
      [SyncDirection.PUSH]: '仅上传',
      [SyncDirection.PULL]: '仅下载',
      [SyncDirection.BIDIRECTIONAL]: '双向同步',
    };
    return map[this.direction];
  }

  /**
   * 同步策略显示文本
   */
  get strategyDisplay(): string {
    const map: Record<SyncStrategy, string> = {
      [SyncStrategy.FULL]: '完整同步',
      [SyncStrategy.INCREMENTAL]: '增量同步',
      [SyncStrategy.AUTO]: '自动选择',
    };
    return map[this.strategy];
  }

  /**
   * 冲突策略显示文本
   */
  get conflictStrategyDisplay(): string {
    const map: Record<ConflictResolutionStrategy, string> = {
      [ConflictResolutionStrategy.LOCAL_WINS]: '本地优先',
      [ConflictResolutionStrategy.REMOTE_WINS]: '远程优先',
      [ConflictResolutionStrategy.LATEST_WINS]: '最新优先',
      [ConflictResolutionStrategy.VECTOR_CLOCK]: '向量时钟',
      [ConflictResolutionStrategy.MANUAL]: '手动解决',
    };
    return map[this.conflictStrategy];
  }

  /**
   * 自动同步状态文本
   */
  get autoSyncStatusDisplay(): string {
    if (!this.autoSync.enabled) return '已关闭';
    const intervalMin = Math.floor(this.autoSync.intervalMs / 60000);
    return `每 ${intervalMin} 分钟`;
  }

  /**
   * 过滤的实体类型显示
   */
  get filterEntityTypesDisplay(): string {
    if (this.filter.entityTypes.length === 0) return '无';
    const typeMap: Record<SyncableEntityType, string> = {
      [SyncableEntityType.GOAL]: '目标',
      [SyncableEntityType.KEY_RESULT]: '关键结果',
      [SyncableEntityType.GOAL_RECORD]: '目标记录',
      [SyncableEntityType.GOAL_REVIEW]: '目标回顾',
      [SyncableEntityType.TASK]: '任务',
      [SyncableEntityType.SCHEDULE]: '日程',
      [SyncableEntityType.REMINDER]: '提醒',
      [SyncableEntityType.SETTINGS]: '设置',
    };
    return this.filter.entityTypes.map((t) => typeMap[t] ?? t).join('、');
  }

  /**
   * 压缩和加密状态
   */
  get securityDisplay(): string {
    const features: string[] = [];
    if (this.compress) features.push('压缩');
    if (this.encrypt) features.push('加密');
    return features.length > 0 ? features.join('、') : '无';
  }

  // ===== ValueObject 方法 =====

  override equals(other: ValueObject): boolean {
    if (!(other instanceof SyncProfileConfig)) return false;
    return (
      this.direction === other.direction &&
      this.strategy === other.strategy &&
      this.conflictStrategy === other.conflictStrategy &&
      this.compress === other.compress &&
      this.encrypt === other.encrypt
    );
  }

  // ===== DTO 转换 =====

  toDTO(): SyncProfileConfigDTO {
    return {
      direction: this.direction,
      strategy: this.strategy,
      conflictStrategy: this.conflictStrategy,
      autoSync: { ...this.autoSync },
      filter: {
        ...this.filter,
        entityTypes: [...this.filter.entityTypes],
      },
      compress: this.compress,
      encrypt: this.encrypt,
    };
  }
}
