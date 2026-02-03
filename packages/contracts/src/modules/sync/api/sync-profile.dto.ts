/**
 * Sync Profile Operations
 * 
 * This file contains DTOs for managing sync profiles.
 * Sync profiles define how data synchronization is configured with external providers.
 */

import { z } from 'zod';
import type { SyncProfileClientDTO } from '../aggregates';

// ============================================================================
// SYNC Profile Operations
// ============================================================================

/**
 * 创建同步配置 Schema
 */
export const CreateSyncProfileSchema = z.object({
  name: z.string().min(1).max(100),
  providerType: z.enum(['GITHUB', 'GITLAB', 'GOOGLE_DRIVE', 'DROPBOX']),
  direction: z.enum(['BIDIRECTIONAL', 'PULL_ONLY', 'PUSH_ONLY']).optional().default('BIDIRECTIONAL'),
  strategy: z.enum(['LAST_WRITE_WINS', 'MANUAL_RESOLUTION', 'AUTO_MERGE']).optional().default('LAST_WRITE_WINS'),
  description: z.string().max(500).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type CreateSyncProfileReq = z.infer<typeof CreateSyncProfileSchema>;
export type CreateSyncProfileRes = SyncProfileClientDTO;

/**
 * 更新同步配置 Schema
 */
export const UpdateSyncProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  direction: z.enum(['BIDIRECTIONAL', 'PULL_ONLY', 'PUSH_ONLY']).optional(),
  strategy: z.enum(['LAST_WRITE_WINS', 'MANUAL_RESOLUTION', 'AUTO_MERGE']).optional(),
  description: z.string().max(500).optional().nullable(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateSyncProfileReq = z.infer<typeof UpdateSyncProfileSchema>;
export type UpdateSyncProfileRes = SyncProfileClientDTO;

/**
 * 获取同步配置列表
 */
export type GetSyncProfilesReq = void;

export interface GetSyncProfilesRes {
  data: SyncProfileClientDTO[];
  total: number;
}

/**
 * 获取单个同步配置
 */
export const GetSyncProfileSchema = z.object({
  profileId: z.string().uuid(),
});

export type GetSyncProfileReq = z.infer<typeof GetSyncProfileSchema>;
export type GetSyncProfileRes = SyncProfileClientDTO;

/**
 * 删除同步配置
 */
export const DeleteSyncProfileSchema = z.object({
  profileId: z.string().uuid(),
});

export type DeleteSyncProfileReq = z.infer<typeof DeleteSyncProfileSchema>;
export type DeleteSyncProfileRes = void;
