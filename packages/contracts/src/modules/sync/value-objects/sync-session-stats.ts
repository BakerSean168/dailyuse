/**
 * Sync Session Stats Value Object
 * 同步会话统计值对象
 */

import type { SyncableEntityType } from './syncable-entity-type';

// ============ DTO 定义 ============

export interface EntitySyncStats {
  entityType: SyncableEntityType;
  pushed: number;
  pulled: number;
  conflicts: number;
  skipped: number;
}

export interface SyncSessionStatsDTO {
  totalEntities: number;
  successCount: number;
  failedCount: number;
  conflictCount: number;
  skippedCount: number;
  byEntityType: EntitySyncStats[];
  bytesTransferred: number;
  durationMs: number;
}

// ============ 接口定义 ============

export interface ISyncSessionStats {
  totalEntities: number;
  successCount: number;
  failedCount: number;
  conflictCount: number;
  skippedCount: number;
  byEntityType: EntitySyncStats[];
  bytesTransferred: number;
  durationMs: number;

  addEntityStats(stats: EntitySyncStats): ISyncSessionStats;
  incrementSuccess(): ISyncSessionStats;
  incrementFailed(): ISyncSessionStats;
  incrementConflict(): ISyncSessionStats;
  toDTO(): SyncSessionStatsDTO;
}
