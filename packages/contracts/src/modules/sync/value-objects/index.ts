/**
 * Value Objects Index
 * 值对象导出
 */

export type {
  DeviceVersionEntry,
  SyncVersionServerDTO,
  SyncVersionClientDTO,
  SyncVersionPersistenceDTO,
  ISyncVersionServer,
  ISyncVersionServerStatic,
} from './SyncVersion';

export type {
  EntityReferenceDTO,
  IEntityReference,
  IEntityReferenceStatic,
} from './EntityReference';

export type {
  ConflictResolutionDTO,
  IConflictResolution,
  IConflictResolutionStatic,
} from './ConflictResolution';

export type {
  DeviceInfoDTO,
  IDeviceInfo,
  IDeviceInfoStatic,
} from './DeviceInfo';

export type {
  AutoSyncConfigDTO,
  SyncFilterConfigDTO,
  SyncProfileConfigDTO,
  GitHubGistAuthConfigDTO,
  GitHubGistProviderConfigDTO,
  WebDAVProviderConfigDTO,
  SyncProviderConfigDTO,
  ISyncProfileConfig,
} from './SyncProfileConfig';

export type {
  EntitySyncStats,
  SyncSessionStatsDTO,
  ISyncSessionStats,
} from './SyncSessionStats';
