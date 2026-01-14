/**
 * Sync 模块 - 领域服务端
 *
 * 包含：
 * - 值对象 (Value Objects)
 * - 实体 (Entities)
 * - 聚合根 (Aggregates)
 * - 仓储接口 (Repository Interfaces)
 */

// Value Objects
export {
  SyncVersion,
  EntityReference,
  ConflictResolution,
  SyncDeviceInfo,
  SyncProfileConfig,
  SyncSessionStats,
} from './value-objects';

// Entities
export { SyncConflict, PendingChange } from './entities';

// Aggregates
export { SyncSession, SyncProfile } from './aggregates';

// Repository Interfaces
export type {
  ISyncSessionRepository,
  SyncSessionQueryOptions,
  ISyncProfileRepository,
  SyncProfileQueryOptions,
  IPendingChangeRepository,
  PendingChangeQueryOptions,
  ISyncConflictRepository,
  SyncConflictQueryOptions,
} from './repositories';
