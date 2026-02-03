/**
 * Sync Operation Operations
 * 
 * This file contains DTOs for executing synchronization operations.
 * Includes starting, canceling, and monitoring sync sessions.
 */

import { z } from 'zod';
import type { SyncStatusDTO } from '../dtos';

// ============================================================================
// SYNC Operation
// ============================================================================

/**
 * 启动同步 Schema
 */
export const StartSyncSchema = z.object({
  profileId: z.string().uuid().optional(),
  includeEntities: z.array(z.string()).optional(),
  dryRun: z.boolean().optional().default(false),
});

export type StartSyncReq = z.infer<typeof StartSyncSchema>;

export interface StartSyncRes {
  syncSessionId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt: number;
}

/**
 * 取消同步
 */
export const CancelSyncSchema = z.object({
  syncSessionId: z.string().uuid(),
});

export type CancelSyncReq = z.infer<typeof CancelSyncSchema>;
export type CancelSyncRes = void;

/**
 * 获取同步状态
 */
export const GetSyncStatusSchema = z.object({
  syncSessionId: z.string().uuid(),
});

export type GetSyncStatusReq = z.infer<typeof GetSyncStatusSchema>;
export type GetSyncStatusRes = SyncStatusDTO;
