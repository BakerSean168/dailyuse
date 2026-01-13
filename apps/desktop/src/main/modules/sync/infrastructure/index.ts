/**
 * Sync Infrastructure Exports
 * 同步模块基础设施层导出
 */

// SyncManager
export {
  SyncManager,
  getSyncManager,
  type SyncManagerConfig,
  type SyncManagerEvents,
  type IDataCollector,
  // Re-exports from contracts
  type SyncStatus,
  type SyncOperation,
  type SyncResult,
  type SyncProgress,
  type SyncConflict,
  type SyncPayload,
  type SyncMetadata,
  type SyncDataBundle,
  type ISyncProvider,
} from './SyncManager';

// GitHub Gist Sync Provider
export {
  GitHubGistSyncProvider,
  createGitHubGistSyncProvider,
  type GitHubGistProviderOptions,
  type GitHubGistSyncConfig,
  type GitHubOAuthState,
  type GitHubUserInfo,
  type GistInfo,
} from './GitHubGistSyncProvider';

// DataCollector
export {
  DataCollector,
  getDataCollector,
  type DataCollectorConfig,
} from './DataCollector';

// SyncChangeTracker
export {
  SyncChangeTracker,
  getSyncChangeTracker,
  type SyncChangeTrackerConfig,
  type ChangeRecord,
  type ChangeType,
  type EntityType,
  type ChangeStats,
} from './SyncChangeTracker';

// SyncCoordinator
export {
  SyncCoordinator,
  getSyncCoordinator,
  type SyncCoordinatorConfig,
} from './SyncCoordinator';

// DataMigrationService
export {
  DataMigrationService,
  getDataMigrationService,
  type MigrationType,
  type MigrationStatus,
  type ConflictResolutionStrategy,
  type MigrationProgress,
  type MigrationResult,
  type MigrationConflict,
  type MigrationConfig,
} from './DataMigrationService';

// DataExportImportService
export {
  DataExportImportService,
  getDataExportImportService,
  type ExportFormat,
  type ExportOptions,
  type ImportOptions,
  type ExportResult,
  type ImportResult,
} from './DataExportImportService';
