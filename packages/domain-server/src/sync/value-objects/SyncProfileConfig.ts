/**
 * SyncProfileConfig 值对象
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
 *
 * 同步配置参数
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

  /**
   * 创建默认配置
   */
  static createDefault(): SyncProfileConfig {
    return new SyncProfileConfig({
      direction: SyncDirection.BIDIRECTIONAL,
      strategy: SyncStrategy.INCREMENTAL,
      conflictStrategy: ConflictResolutionStrategy.LATEST_WINS,
      autoSync: {
        enabled: true,
        intervalMs: 5 * 60 * 1000,
        wifiOnly: false,
        syncOnStartup: true,
        syncOnChange: true,
        changeDebounceMs: 3000,
      },
      filter: {
        entityTypes: [
          SyncableEntityType.GOAL,
          SyncableEntityType.KEY_RESULT,
          SyncableEntityType.GOAL_RECORD,
          SyncableEntityType.TASK,
          SyncableEntityType.SCHEDULE,
          SyncableEntityType.REMINDER,
          SyncableEntityType.SETTINGS,
        ],
        includeDeleted: true,
      },
      compress: true,
      encrypt: false,
    });
  }

  /**
   * 从 DTO 创建
   */
  static fromDTO(dto: SyncProfileConfigDTO): SyncProfileConfig {
    return new SyncProfileConfig(dto);
  }

  // ===== 业务方法 =====

  /**
   * 创建修改后的副本
   */
  with(updates: Partial<SyncProfileConfigDTO>): SyncProfileConfig {
    return new SyncProfileConfig({
      direction: updates.direction ?? this.direction,
      strategy: updates.strategy ?? this.strategy,
      conflictStrategy: updates.conflictStrategy ?? this.conflictStrategy,
      autoSync: updates.autoSync ?? this.autoSync,
      filter: updates.filter ?? this.filter,
      compress: updates.compress ?? this.compress,
      encrypt: updates.encrypt ?? this.encrypt,
    });
  }

  /**
   * 是否同步指定实体类型
   */
  shouldSyncEntityType(entityType: SyncableEntityType): boolean {
    return this.filter.entityTypes.includes(entityType);
  }

  /**
   * 是否为双向同步
   */
  get isBidirectional(): boolean {
    return this.direction === SyncDirection.BIDIRECTIONAL;
  }

  /**
   * 是否为全量同步
   */
  get isFullSync(): boolean {
    return this.strategy === SyncStrategy.FULL;
  }

  // ===== ValueObject 方法 =====

  equals(other: ValueObject): boolean {
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
