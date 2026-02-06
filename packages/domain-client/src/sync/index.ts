/**
 * Sync Module - Domain Client
 * 同步模块 - 领域客户端
 *
 * 主要处理客户端与服务端的数据同步
 */

// Re-export sync types from contracts
export {
  SyncableEntityType,
  SyncOperationType,
  ConflictResolutionStrategy,
  SyncStatus,
} from '@dailyuse/contracts/sync';

export type {
  SyncMetadata,
  EntityReference,
  SyncChange,
  SyncConflict,
  ConflictResolution,
  PullSyncRequest,
  PullSyncResponse,
  PushSyncRequest,
  PushSyncResponse,
  ResolveConflictsRequest,
  ResolveConflictsResponse,
  SyncStatusInfo,
  SyncRpcMap,
  SyncEventMap,
} from '@dailyuse/contracts/sync';

// Re-export from domain-shared
export * from '@dailyuse/domain-shared/sync';
