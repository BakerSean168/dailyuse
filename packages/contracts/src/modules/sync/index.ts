/**
 * Sync Module Exports
 * 同步模块 - 显式导出
 *
 * 使用方式：
 * ```typescript
 * import { SyncSessionStatus, SyncDirection, SyncEvents } from '@dailyuse/contracts/sync';
 * import type { SyncSessionServerDTO, SyncProfileClientDTO } from '@dailyuse/contracts/sync';
 * ```
 */

// ============ Enums 枚举 ============
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
} from './enums';

// ============ Events 事件 ============
export { SyncEvents } from './events';

export type {
  SyncEventType,
  BaseSyncDomainEvent,
  SyncSessionCreatedEvent,
  SyncSessionStartedEvent,
  SyncSessionProgressEvent,
  SyncSessionCompletedEvent,
  SyncSessionFailedEvent,
  SyncSessionCancelledEvent,
  ConflictDetectedEvent,
  ConflictResolvedEvent,
  SyncProfileCreatedEvent,
  SyncProfileUpdatedEvent,
  ProviderConnectedEvent,
  ProviderDisconnectedEvent,
  EntityChangeRecordedEvent,
  ChangeSyncedEvent,
  SyncDomainEvent,
} from './events';

// ============ Value Objects 值对象 ============
export type {
  DeviceVersionEntry,
  SyncVersionServerDTO,
  SyncVersionClientDTO,
  SyncVersionPersistenceDTO,
  ISyncVersionServer,  EntityReferenceDTO,
  IEntityReference,  ConflictResolutionDTO,
  IConflictResolution,  DeviceInfoDTO,
  IDeviceInfo,  AutoSyncConfigDTO,
  SyncFilterConfigDTO,
  SyncProfileConfigDTO,
  GitHubGistAuthConfigDTO,
  GitHubGistProviderConfigDTO,
  WebDAVProviderConfigDTO,
  SyncProviderConfigDTO,
  ISyncProfileConfig,
  EntitySyncStats,
  SyncSessionStatsDTO,
  ISyncSessionStats,
} from './value-objects';

// ============ Entities 实体 ============
export type {
  SyncConflictServerDTO,
  SyncConflictPersistenceDTO,
  SyncConflictServer,  SyncConflictClientDTO,
  SyncConflictClient,  PendingChangeServerDTO,
  PendingChangePersistenceDTO,
  PendingChangeServer,  PendingChangeClientDTO,
  PendingChangeClient,  DataSnapshotServerDTO,
  DataSnapshotPersistenceDTO,
  DataSnapshotServer,  DataSnapshotClientDTO,
  DataSnapshotClient,} from './entities';

// ============ Aggregates 聚合根 ============
export type {
  SyncSessionServerDTO,
  SyncSessionPersistenceDTO,
  SyncSessionCreatedDomainEvent,
  SyncSessionCompletedDomainEvent,
  SyncSessionFailedDomainEvent,
  SyncSessionServer,  SyncSessionClientDTO,
  SyncSessionClient,  SyncProfileServerDTO,
  SyncProfilePersistenceDTO,
  SyncProfileCreatedDomainEvent,
  SyncProfileConnectedDomainEvent,
  SyncProfileServer,  SyncProfileClientDTO,
  SyncProfileClient,  SyncStateServerDTO,
  SyncStatePersistenceDTO,
  SyncStateServer,  SyncStateClientDTO,
  SyncStateClient,} from './aggregates';

// ============ API Requests/Responses ============
export { SyncIpcChannels } from './api-requests';

export type {
  SyncIpcChannel,
  StartSyncRequest,
  StartSyncResponse,
  CancelSyncRequest,
  SyncStatusResponse,
  CreateSyncProfileRequest,
  UpdateSyncProfileRequest,
  SyncProfileListResponse,
  ResolveConflictRequest,
  ConflictListResponse,
  PendingChangesRequest,
  PendingChangesResponse,
  SyncHistoryRequest,
  SyncHistoryResponse,
  GitHubOAuthStartResponse,
  GitHubOAuthCallbackRequest,
  ProviderConnectionStatusResponse,
  ExportDataRequest,
  ExportDataResponse,
  ImportDataRequest,
  ImportDataResponse,
} from './api-requests';
