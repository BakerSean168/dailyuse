/**
 * Sync Module API Response Types
 * 同步模块 API 响应类型
 */

import type { SyncSessionClientDTO, SyncProfileClientDTO, SyncStateClientDTO } from '../aggregates';
import type { SyncConflictClientDTO, PendingChangeClientDTO } from '../entities';

// ============ 同步操作响应 ============

export interface StartSyncResponse {
  sessionId: string;
  session: SyncSessionClientDTO;
}

export interface SyncStatusResponse {
  state: SyncStateClientDTO;
  currentSession?: SyncSessionClientDTO;
  pendingConflictsCount: number;
  pendingChangesCount: number;
}

// ============ 配置管理响应 ============

export interface SyncProfileListResponse {
  profiles: SyncProfileClientDTO[];
  activeProfileId?: string;
  defaultProfileId?: string;
  total: number;
}

// ============ 冲突解决响应 ============

export interface ConflictListResponse {
  conflicts: SyncConflictClientDTO[];
  total: number;
}

// ============ 变更管理响应 ============

export interface PendingChangesResponse {
  changes: PendingChangeClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  byType: Record<string, number>;
}

// ============ 历史记录响应 ============

export interface SyncHistoryResponse {
  sessions: SyncSessionClientDTO[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  summary: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
  };
}

// ============ 提供者认证响应 ============

export interface GitHubOAuthStartResponse {
  authUrl: string;
  state: string;
}

export interface ProviderConnectionStatusResponse {
  isConnected: boolean;
  userInfo?: { username: string; avatarUrl?: string };
  gistInfo?: { gistId: string; description: string; isPrivate: boolean };
  error?: string;
}

// ============ 导入导出响应 ============

export interface ExportDataResponse {
  ok: boolean;
  filePath?: string;
  statistics: Record<string, number>;
  fileSize: number;
  error?: string;
}

export interface ImportDataResponse {
  ok: boolean;
  imported: Record<string, number>;
  skipped: number;
  overwritten: number;
  warnings: string[];
  error?: string;
}
