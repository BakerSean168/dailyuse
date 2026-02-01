/**
 * Value Objects Index
 * 值对象导出
 */

// ============ Enum-like Value Objects ============
export { SyncSessionStatus } from './sync-session-status';
export { SyncDirection } from './sync-direction';
export { SyncStrategy } from './sync-strategy';
export { ConflictResolutionStrategy } from './conflict-resolution-strategy';
export { ConflictStatus } from './conflict-status';
export { ChangeOperationType } from './change-operation-type';
export { SyncableEntityType } from './syncable-entity-type';
export { SyncProviderType } from './sync-provider-type';
export { SyncTriggerType } from './sync-trigger-type';
export { SyncGlobalStatus } from './sync-global-status';

// ============ Complex Value Objects ============
export type {
  DeviceVersionEntry,
  SyncVersionServerDTO,
  SyncVersionClientDTO,
  SyncVersionPersistenceDTO,
  ISyncVersionServer,
} from './sync-version';

export type {
  EntityReferenceDTO,
  IEntityReference,
} from './entity-reference';

export type {
  ConflictResolutionDTO,
  IConflictResolution,
} from './conflict-resolution';

export type {
  DeviceInfoDTO,
  IDeviceInfo,
} from './device-info';

export type {
  AutoSyncConfigDTO,
  SyncFilterConfigDTO,
  SyncProfileConfigDTO,
  GitHubGistAuthConfigDTO,
  GitHubGistProviderConfigDTO,
  WebDAVProviderConfigDTO,
  SyncProviderConfigDTO,
  ISyncProfileConfig,
} from './sync-profile-config';

export type {
  EntitySyncStats,
  SyncSessionStatsDTO,
  ISyncSessionStats,
} from './sync-session-stats';
