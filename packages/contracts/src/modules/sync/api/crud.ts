/**
 * Sync Module - API Contracts (CRUD + Operations)
 * 
 * 【规范说明：API 层导出】
 * 使用 Zod Schema 定义所有请求，类型通过 z.infer 推导
 * 响应类型明确指向 DTO（aggregates/entities）
 */

import { z } from 'zod';
import type { SyncProfileClientDTO, SyncConflictClientDTO } from '../aggregates';
import type { SyncHistoryItem, SyncStatusDTO } from '../dtos';

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

// ============================================================================
// SYNC History
// ============================================================================

/**
 * 获取同步历史
 */
export const GetSyncHistorySchema = z.object({
  profileId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export type GetSyncHistoryReq = z.infer<typeof GetSyncHistorySchema>;

export interface SyncHistoryItem {
  syncSessionId: string;
  profileId: string;
  status: 'COMPLETED' | 'FAILED';
  startedAt: number;
  completedAt: number;
  changedItems: number;
  totalItems: number;
  duration: number; // milliseconds
  errors?: Array<{
    item: string;
    error: string;
  }>;
}


export type ExportSyncDataReq = z.infer<typeof ExportSyncDataSchema>;

export interface ExportSyncDataRes {
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
}

/**
 * 导入数据 Schema
 */
export const ImportSyncDataSchema = z.object({
  data: z.union([z.string(), z.instanceof(Uint8Array)]),
  format: z.enum(['JSON', 'CSV', 'BACKUP']),
  mergeMode: z.enum(['REPLACE', 'MERGE']).optional().default('MERGE'),
});

export type ImportSyncDataReq = z.infer<typeof ImportSyncDataSchema>;

export interface ImportSyncDataRes {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors?: Array<{
    item: string;
    error: string;
  }>;
}
