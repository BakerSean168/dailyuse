/**
 * Sync Module API Request Types
 * 同步模块 API 请求类型
 */

import type { SyncDirection } from '../value-objects/sync-direction';
import type { SyncStrategy } from '../value-objects/sync-strategy';
import type { SyncProviderType } from '../value-objects/sync-provider-type';
import type { SyncTriggerType } from '../value-objects/sync-trigger-type';
import type { SyncableEntityType } from '../value-objects/syncable-entity-type';
import type { SyncProfileConfigDTO, SyncProviderConfigDTO, ConflictResolutionDTO } from '../value-objects';

// ============ IPC 通道常量 ============

export const SyncIpcChannels = {
  START_SYNC: 'sync:start',
  CANCEL_SYNC: 'sync:cancel',
  GET_STATUS: 'sync:get-status',
  RETRY_SYNC: 'sync:retry',
  GET_PROFILES: 'sync:profiles:get',
  GET_PROFILE: 'sync:profiles:get-one',
  CREATE_PROFILE: 'sync:profiles:create',
  UPDATE_PROFILE: 'sync:profiles:update',
  DELETE_PROFILE: 'sync:profiles:delete',
  SET_DEFAULT_PROFILE: 'sync:profiles:set-default',
  ACTIVATE_PROFILE: 'sync:profiles:activate',
  DEACTIVATE_PROFILE: 'sync:profiles:deactivate',
  GET_CONFLICTS: 'sync:conflicts:get',
  GET_CONFLICT: 'sync:conflicts:get-one',
  RESOLVE_CONFLICT: 'sync:conflicts:resolve',
  IGNORE_CONFLICT: 'sync:conflicts:ignore',
  AUTO_RESOLVE_CONFLICTS: 'sync:conflicts:auto-resolve',
  GET_PENDING_CHANGES: 'sync:changes:get-pending',
  GET_PENDING_COUNT: 'sync:changes:get-count',
  GET_HISTORY: 'sync:history:get',
  GET_SESSION: 'sync:session:get',
  START_GITHUB_OAUTH: 'sync:github:oauth-start',
  GITHUB_OAUTH_CALLBACK: 'sync:github:oauth-callback',
  CHECK_PROVIDER_CONNECTION: 'sync:provider:check-connection',
  DISCONNECT_PROVIDER: 'sync:provider:disconnect',
  EXPORT_DATA: 'sync:export',
  IMPORT_DATA: 'sync:import',
} as const;

export type SyncIpcChannel = typeof SyncIpcChannels[keyof typeof SyncIpcChannels];

// ============ 同步操作 ============

export interface StartSyncRequest {
  profileId?: string;
  direction?: SyncDirection;
  strategy?: SyncStrategy;
  triggerType: SyncTriggerType;
  forceFullSync?: boolean;
}

export interface CancelSyncRequest {
  sessionId: string;
  reason?: string;
}

// ============ 配置管理 ============

export interface CreateSyncProfileRequest {
  name: string;
  description?: string;
  providerType: SyncProviderType;
  providerConfig: SyncProviderConfigDTO;
  syncConfig: SyncProfileConfigDTO;
  setAsDefault?: boolean;
}

export interface UpdateSyncProfileRequest {
  profileId: string;
  name?: string;
  description?: string;
  providerConfig?: Partial<SyncProviderConfigDTO>;
  syncConfig?: Partial<SyncProfileConfigDTO>;
}

// ============ 冲突解决 ============

export interface ResolveConflictRequest {
  conflictId: string;
  resolution: ConflictResolutionDTO;
}

// ============ 变更管理 ============

export interface PendingChangesRequest {
  entityType?: SyncableEntityType;
  page?: number;
  pageSize?: number;
}

// ============ 历史记录 ============

export interface SyncHistoryRequest {
  profileId?: string;
  startDate?: number;
  endDate?: number;
  page?: number;
  pageSize?: number;
}

// ============ 提供者认证 ============

export interface GitHubOAuthCallbackRequest {
  code: string;
  state: string;
}

// ============ 导入导出 ============

export interface ExportDataRequest {
  format: 'json' | 'encrypted-json';
  entityTypes: SyncableEntityType[];
  includeDeleted: boolean;
  compress: boolean;
  encryptionKey?: string;
  exportPath?: string;
}

export interface ImportDataRequest {
  importPath: string;
  decryptionKey?: string;
  conflictStrategy: 'skip' | 'overwrite' | 'merge';
  dryRun?: boolean;
}
