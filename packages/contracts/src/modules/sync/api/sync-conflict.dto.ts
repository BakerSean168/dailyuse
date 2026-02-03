/**
 * Sync Conflict Resolution Operations
 * 
 * This file contains DTOs for managing synchronization conflicts.
 * Includes viewing, resolving, and auto-resolving conflicts that occur during sync.
 */

import { z } from 'zod';
import type { SyncConflictClientDTO } from '../entities';

// ============================================================================
// SYNC Conflict Resolution
// ============================================================================

/**
 * 获取冲突列表
 */
export type GetSyncConflictsReq = void;

export interface GetSyncConflictsRes {
  data: SyncConflictClientDTO[];
  total: number;
}

/**
 * 解决冲突 Schema
 */
export const ResolveSyncConflictSchema = z.object({
  conflictId: z.string().uuid(),
  resolution: z.enum(['USE_LOCAL', 'USE_REMOTE', 'USE_CUSTOM']),
  customData: z.unknown().optional(),
});

export type ResolveSyncConflictReq = z.infer<typeof ResolveSyncConflictSchema>;
export type ResolveSyncConflictRes = SyncConflictClientDTO;

/**
 * 忽略冲突 Schema
 */
export const IgnoreSyncConflictSchema = z.object({
  conflictId: z.string().uuid(),
});

export type IgnoreSyncConflictReq = z.infer<typeof IgnoreSyncConflictSchema>;
export type IgnoreSyncConflictRes = void;

/**
 * 自动解决冲突
 */
export const AutoResolveSyncConflictsSchema = z.object({
  strategy: z.enum(['LAST_WRITE_WINS', 'LOCAL_PRIORITY', 'REMOTE_PRIORITY']),
});

export type AutoResolveSyncConflictsReq = z.infer<typeof AutoResolveSyncConflictsSchema>;

export interface AutoResolveSyncConflictsRes {
  resolvedCount: number;
  failedCount: number;
}
