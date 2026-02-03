import type {
  StartSyncRequest,
  StartSyncResponse,
  CancelSyncRequest,
  CreateSyncProfileRequest,
  UpdateSyncProfileRequest,
  SyncStatusResponse,
  SyncProfileListResponse,
  ResolveConflictRequest,
  ConflictListResponse,
  PendingChangesRequest,
  PendingChangesResponse,
  SyncHistoryRequest,
  SyncHistoryResponse,
  GitHubOAuthStartResponse,
  ProviderConnectionStatusResponse,
  ExportDataResponse,
  ImportDataResponse,
} from '../api';

// === Sync Module RPC Map ===
export type SyncRpcMap = {
  // === Sync Operations ===
  'sync:start': [StartSyncRequest, StartSyncResponse];
  'sync:cancel': [CancelSyncRequest, { ok: boolean }];
  'sync:get-status': [{}, SyncStatusResponse];
  'sync:retry': [{ sessionId: string }, StartSyncResponse];
  
  // === Profile Management ===
  'sync-profile:get-list': [{}, SyncProfileListResponse];
  'sync-profile:get': [{ profileId: string }, any];
  'sync-profile:create': [CreateSyncProfileRequest, any];
  'sync-profile:update': [UpdateSyncProfileRequest, any];
  'sync-profile:delete': [{ profileId: string }, { ok: boolean }];
  'sync-profile:set-default': [{ profileId: string }, any];
  'sync-profile:activate': [{ profileId: string }, any];
  'sync-profile:deactivate': [{ profileId: string }, any];
  
  // === Conflict Management ===
  'sync-conflict:list': [{ profileId?: string; entityType?: string }, ConflictListResponse];
  'sync-conflict:get': [{ conflictId: string }, any];
  'sync-conflict:resolve': [ResolveConflictRequest, { ok: boolean }];
  'sync-conflict:ignore': [{ conflictId: string }, { ok: boolean }];
  'sync-conflict:auto-resolve': [{ profileId?: string }, { resolvedCount: number }];
  
  // === Change Management ===
  'sync-change:get-pending': [PendingChangesRequest, PendingChangesResponse];
  'sync-change:get-count': [{}, { count: number }];
  
  // === History ===
  'sync-history:get': [SyncHistoryRequest, SyncHistoryResponse];
  'sync-session:get': [{ sessionId: string }, any];
  
  // === OAuth ===
  'sync-github:oauth-start': [{}, GitHubOAuthStartResponse];
  'sync-github:oauth-callback': [{ code: string; state: string }, { ok: boolean; sessionId?: string }];
  
  // === Provider Management ===
  'sync-provider:check-connection': [{ providerType: string }, ProviderConnectionStatusResponse];
  'sync-provider:disconnect': [{ providerType: string }, { ok: boolean }];
  
  // === Data Import/Export ===
  'sync:export': [{ includeHistory?: boolean; format?: string }, ExportDataResponse];
  'sync:import': [{ filePath: string; overwrite?: boolean }, ImportDataResponse];
};
