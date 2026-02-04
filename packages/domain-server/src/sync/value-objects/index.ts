/**
 * Sync Module Value Objects - Domain Server
 * 
 * 同步模块值对象
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  SyncVersionServerDTO,
  DeviceVersionEntry,
  EntityReferenceDTO,
  ConflictResolutionDTO,
  DeviceInfoDTO,
  SyncProfileConfigDTO,
  SyncSessionStatsDTO,
  SyncableEntityType,
  ConflictResolutionStrategy,
  AutoSyncConfigDTO,
  SyncFilterConfigDTO,
  EntitySyncStats,
  SyncDirection,
  SyncStrategy,
} from '@dailyuse/contracts/sync';

// ============ 从 domain-shared 重新导出 ============

// IDs
export {
  SyncProfileId,
  SyncSessionId,
  SyncConflictId,
  PendingChangeId,
  DataSnapshotId,
} from '@dailyuse/domain-shared/sync';

// Enum-like Value Objects
export {
  SyncSessionStatus,
  SyncDirection,
  SyncStrategy,
  ConflictResolutionStrategy,
  ConflictStatus,
  ChangeOperationType,
  SyncableEntityType,
  SyncProviderType,
  SyncTriggerType,
  SyncGlobalStatus,
} from '@dailyuse/domain-shared/sync';

// ============ 服务端特有的值对象 ============

/**
 * SyncVersion 值对象 (Server)
 * 同步版本 - 向量时钟
 */
export class SyncVersion extends ValueObject<SyncVersionServerDTO> {
  private constructor(props: SyncVersionServerDTO) {
    super(props);
  }

  static fromServerDTO(dto: SyncVersionServerDTO): SyncVersion {
    return new SyncVersion(dto);
  }

  static create(params: {
    logicalVersion: number;
    vectorClock: DeviceVersionEntry[];
    lastModifiedBy: string;
    lastModifiedAt: number;
  }): SyncVersion {
    return new SyncVersion({
      logicalVersion: params.logicalVersion,
      vectorClock: params.vectorClock,
      lastModifiedBy: params.lastModifiedBy,
      lastModifiedAt: params.lastModifiedAt,
    });
  }

  get logicalVersion(): number { return this.props.logicalVersion; }
  get vectorClock(): readonly DeviceVersionEntry[] { return this.props.vectorClock; }
  get lastModifiedBy(): string { return this.props.lastModifiedBy; }
  get lastModifiedAt(): number { return this.props.lastModifiedAt; }

  toServerDTO(): SyncVersionServerDTO {
    return { ...this.props };
  }
}

/**
 * EntityReference 值对象 (Server)
 * 实体引用
 */
export class EntityReference extends ValueObject<EntityReferenceDTO> {
  private constructor(props: EntityReferenceDTO) {
    super(props);
  }

  static fromServerDTO(dto: EntityReferenceDTO): EntityReference {
    return new EntityReference(dto);
  }

  static create(entityType: SyncableEntityType, entityId: string, entityName?: string): EntityReference {
    return new EntityReference({ entityType, entityId, entityName });
  }

  get entityType(): SyncableEntityType { return this.props.entityType; }
  get entityId(): string { return this.props.entityId; }
  get entityName(): string | undefined { return this.props.entityName; }

  toServerDTO(): EntityReferenceDTO {
    return { ...this.props };
  }
}

/**
 * ConflictResolution 值对象 (Server)
 * 冲突解决记录
 */
export class ConflictResolution extends ValueObject<ConflictResolutionDTO> {
  private constructor(props: ConflictResolutionDTO) {
    super(props);
  }

  static fromServerDTO(dto: ConflictResolutionDTO): ConflictResolution {
    return new ConflictResolution(dto);
  }

  get strategy(): ConflictResolutionStrategy { return this.props.strategy; }
  get selectedVersion(): 'local' | 'remote' | 'merged' { return this.props.selectedVersion; }
  get resolvedData(): unknown { return this.props.resolvedData; }
  get resolvedBy(): string { return this.props.resolvedBy; }
  get resolvedAt(): number { return this.props.resolvedAt; }
  get notes(): string | undefined { return this.props.notes; }

  toServerDTO(): ConflictResolutionDTO {
    return { ...this.props };
  }
}

/**
 * DeviceInfo 值对象 (Server)
 * 同步设备信息
 */
export class DeviceInfo extends ValueObject<DeviceInfoDTO> {
  private constructor(props: DeviceInfoDTO) {
    super(props);
  }

  static fromServerDTO(dto: DeviceInfoDTO): DeviceInfo {
    return new DeviceInfo(dto);
  }

  get deviceId(): string { return this.props.deviceId; }
  get deviceName(): string { return this.props.deviceName; }
  get deviceType(): 'desktop' | 'web' | 'mobile' { return this.props.deviceType; }
  get os(): string { return this.props.os; }
  get appVersion(): string { return this.props.appVersion; }
  get lastActiveAt(): number { return this.props.lastActiveAt; }

  toServerDTO(): DeviceInfoDTO {
    return { ...this.props };
  }
}

/**
 * SyncProfileConfig 值对象 (Server)
 * 同步配置
 */
export class SyncProfileConfig extends ValueObject<SyncProfileConfigDTO> {
  private constructor(props: SyncProfileConfigDTO) {
    super(props);
  }

  static fromServerDTO(dto: SyncProfileConfigDTO): SyncProfileConfig {
    return new SyncProfileConfig(dto);
  }

  static createDefault(): SyncProfileConfig {
    const defaultAutoSync: AutoSyncConfigDTO = {
      enabled: true,
      intervalMs: 300000, // 5分钟
      wifiOnly: false,
      syncOnStartup: true,
      syncOnChange: true,
      changeDebounceMs: 1000,
    };

    const defaultFilter: SyncFilterConfigDTO = {
      entityTypes: [],
      includeDeleted: false,
    };

    return new SyncProfileConfig({
      direction: 'bidirectional' as SyncDirection,
      strategy: 'incremental' as SyncStrategy,
      conflictStrategy: 'LatestWins' as ConflictResolutionStrategy,
      autoSync: defaultAutoSync,
      filter: defaultFilter,
      compress: true,
      encrypt: false,
    });
  }

  get direction(): SyncDirection { return this.props.direction; }
  get strategy(): SyncStrategy { return this.props.strategy; }
  get conflictStrategy(): ConflictResolutionStrategy { return this.props.conflictStrategy; }
  get autoSync(): AutoSyncConfigDTO { return this.props.autoSync; }
  get filter(): SyncFilterConfigDTO { return this.props.filter; }
  get compress(): boolean { return this.props.compress; }
  get encrypt(): boolean { return this.props.encrypt; }

  toServerDTO(): SyncProfileConfigDTO {
    return { ...this.props };
  }
}

/**
 * SyncSessionStats 值对象 (Server)
 * 同步会话统计
 */
export class SyncSessionStats extends ValueObject<SyncSessionStatsDTO> {
  private constructor(props: SyncSessionStatsDTO) {
    super(props);
  }

  static fromServerDTO(dto: SyncSessionStatsDTO): SyncSessionStats {
    return new SyncSessionStats(dto);
  }

  static createEmpty(): SyncSessionStats {
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

  get totalEntities(): number { return this.props.totalEntities; }
  get successCount(): number { return this.props.successCount; }
  get failedCount(): number { return this.props.failedCount; }
  get conflictCount(): number { return this.props.conflictCount; }
  get skippedCount(): number { return this.props.skippedCount; }
  get byEntityType(): EntitySyncStats[] { return this.props.byEntityType; }
  get bytesTransferred(): number { return this.props.bytesTransferred; }
  get durationMs(): number { return this.props.durationMs; }

  toServerDTO(): SyncSessionStatsDTO {
    return { ...this.props };
  }
}
