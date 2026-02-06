/**
 * Sync Module Exports
 * 同步模块 - 统一导出
 * 
 * 【设计说明】
 * 简化版同步模块，专注于本地优先的核心需求：
 * - 基于时间戳的增量同步
 * - 基于版本号的冲突检测
 * - 软删除支持
 * 
 * 【使用方式】
 * ```typescript
 * import { 
 *   SyncableEntityType, 
 *   SyncOperationType,
 *   PullSyncRequest,
 *   SyncRpcMap 
 * } from '@dailyuse/contracts/sync';
 * ```
 */

// ============ Value Objects ============
export {
  // 枚举
  SyncableEntityType,
  SyncOperationType,
  ConflictResolutionStrategy,
  SyncStatus,
} from './value-objects';

export type {
  // 核心 DTO
  SyncMetadata,
  EntityReference,
  SyncChange,
  SyncConflict,
  ConflictResolution,
  // 请求/响应 DTO
  PullSyncRequest,
  PullSyncResponse,
  PushSyncRequest,
  PushSyncResponse,
  ResolveConflictsRequest,
  ResolveConflictsResponse,
  SyncStatusInfo,
} from './value-objects';

// ============ API ============
export type { SyncRpcMap, SyncEventMap } from './api';
