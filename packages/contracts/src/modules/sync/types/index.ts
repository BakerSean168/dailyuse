/**
 * Sync Module Types Index
 * 同步模块类型导出
 */

// Sync Provider Types
export type {
  SyncProviderType,
  SyncOperation,
  SyncStatus,
  ConflictResolutionStrategy,
  SyncProviderConfig,
  GitHubGistProviderConfig,
  WebDAVProviderConfig,
  LocalFileProviderConfig,
  SyncMetadata,
  SyncResult,
  SyncProgress,
  SyncConflict,
  ISyncProvider,
  SyncProviderEvents,
} from './sync-provider';

// Sync Payload Types
export {
  SYNC_DATA_FORMAT_VERSION,
} from './sync-payload';

export type {
  SyncGoalData,
  SyncTaskData,
  SyncScheduleData,
  SyncReminderData,
  SyncSettingsData,
  SyncDataBundle,
  SyncPayload,
  SyncChange,
  IncrementalSyncPayload,
  ImportExportOptions,
  ImportResult,
  ExportResult,
} from './sync-payload';

// GitHub Sync Types
export type {
  GitHubOAuthScope,
  GitHubOAuthConfig,
  GitHubOAuthState,
  GitHubUserInfo,
  GistFile,
  GistInfo,
  CreateGistRequest,
  UpdateGistRequest,
  GitHubGistSyncConfig,
  GitHubApiError,
  GistFileSplitStrategy,
  GitHubOAuthTokenResponse,
  GitHubDeviceFlowResponse,
} from './github-sync';

export { DEFAULT_GIST_SPLIT_STRATEGY } from './github-sync';
