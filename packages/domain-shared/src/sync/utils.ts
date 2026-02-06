/**
 * Sync Module - 工具函数
 * 同步模块的纯函数工具
 */

import type { SyncMetadata, SyncChange, SyncConflict, EntityReference } from '@dailyuse/contracts/sync';
import { SyncOperationType, ConflictResolutionStrategy } from '@dailyuse/contracts/sync';

// ============ 同步元数据工具 ============

/**
 * 创建新实体的同步元数据
 */
export function createSyncMetadata(): SyncMetadata {
  const now = Date.now();
  return {
    version: 1,
    updatedAt: now,
    deletedAt: null,
  };
}

/**
 * 更新实体时的同步元数据
 */
export function updateSyncMetadata(current: SyncMetadata): SyncMetadata {
  return {
    ...current,
    version: current.version + 1,
    updatedAt: Date.now(),
  };
}

/**
 * 软删除实体时的同步元数据
 */
export function deleteSyncMetadata(current: SyncMetadata): SyncMetadata {
  const now = Date.now();
  return {
    ...current,
    version: current.version + 1,
    updatedAt: now,
    deletedAt: now,
  };
}

// ============ 冲突检测工具 ============

/**
 * 检测是否存在版本冲突
 * 
 * @param clientVersion 客户端版本号
 * @param serverVersion 服务端版本号
 * @returns true 如果存在冲突
 */
export function hasVersionConflict(clientVersion: number, serverVersion: number): boolean {
  // 如果服务端版本号大于客户端的基础版本，说明服务端有更新的变更
  return serverVersion > clientVersion;
}

/**
 * 检测两个变更是否冲突
 */
export function detectConflict(
  clientChange: SyncChange,
  serverData: unknown,
  serverSyncMetadata: SyncMetadata,
): SyncConflict | null {
  // 如果客户端基于的版本不是服务端当前版本，则存在冲突
  if (hasVersionConflict(clientChange.syncMetadata.version - 1, serverSyncMetadata.version)) {
    return {
      entity: clientChange.entity,
      clientData: clientChange.data,
      clientSyncMetadata: clientChange.syncMetadata,
      serverData,
      serverSyncMetadata,
      detectedAt: Date.now(),
    };
  }
  return null;
}

// ============ 冲突解决工具 ============

/**
 * 根据策略解决冲突
 */
export function resolveConflict(
  conflict: SyncConflict,
  strategy: ConflictResolutionStrategy,
  manualData?: unknown,
): { data: unknown; syncMetadata: SyncMetadata } {
  const now = Date.now();
  const baseVersion = Math.max(
    conflict.clientSyncMetadata.version,
    conflict.serverSyncMetadata.version,
  );

  switch (strategy) {
    case ConflictResolutionStrategy.ClientWins:
      return {
        data: conflict.clientData,
        syncMetadata: {
          version: baseVersion + 1,
          updatedAt: now,
          deletedAt: conflict.clientSyncMetadata.deletedAt,
        },
      };

    case ConflictResolutionStrategy.ServerWins:
      return {
        data: conflict.serverData,
        syncMetadata: {
          version: baseVersion + 1,
          updatedAt: now,
          deletedAt: conflict.serverSyncMetadata.deletedAt,
        },
      };

    case ConflictResolutionStrategy.LastWriteWins:
      const clientIsNewer = conflict.clientSyncMetadata.updatedAt > conflict.serverSyncMetadata.updatedAt;
      const winnerMeta = clientIsNewer ? conflict.clientSyncMetadata : conflict.serverSyncMetadata;
      return {
        data: clientIsNewer ? conflict.clientData : conflict.serverData,
        syncMetadata: {
          version: baseVersion + 1,
          updatedAt: now,
          deletedAt: winnerMeta.deletedAt,
        },
      };

    case ConflictResolutionStrategy.Manual:
      if (manualData === undefined) {
        throw new Error('Manual resolution requires resolved data');
      }
      return {
        data: manualData,
        syncMetadata: {
          version: baseVersion + 1,
          updatedAt: now,
          deletedAt: null,
        },
      };

    default:
      throw new Error(`Unknown resolution strategy: ${strategy}`);
  }
}

// ============ 变更创建工具 ============

/**
 * 创建一个同步变更记录
 */
export function createSyncChange(
  entity: EntityReference,
  operation: SyncOperationType,
  data: unknown | null,
  syncMetadata: SyncMetadata,
): SyncChange {
  return {
    entity,
    operation,
    data,
    syncMetadata,
    changedAt: Date.now(),
  };
}

// ============ 过滤工具 ============

/**
 * 过滤出指定时间之后的变更
 */
export function filterChangesSince(changes: SyncChange[], since: number): SyncChange[] {
  return changes.filter(change => change.changedAt > since);
}

/**
 * 检查实体是否已软删除
 */
export function isDeleted(syncMetadata: SyncMetadata): boolean {
  return syncMetadata.deletedAt !== null;
}

/**
 * 比较两个实体引用是否相同
 */
export function isSameEntity(a: EntityReference, b: EntityReference): boolean {
  return a.entityType === b.entityType && a.entityId === b.entityId;
}
