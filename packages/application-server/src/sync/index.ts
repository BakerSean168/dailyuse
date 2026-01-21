/**
 * Sync Module - Application Server
 *
 * 同步模块应用层服务
 *
 * Pattern:
 * - Each service is a class with a single `execute` method
 * - Dependencies are injected via constructor
 * - Returns DTOs, not domain objects
 * - 类型定义请从 @dailyuse/contracts/sync 导入
 */

// ============================================================
// SyncProfile Services
// ============================================================

export { CreateSyncProfile, createSyncProfile } from './services/create-sync-profile';
export { UpdateSyncProfile, updateSyncProfile } from './services/update-sync-profile';
export { DeleteSyncProfile, deleteSyncProfile } from './services/delete-sync-profile';
export { GetSyncProfile, getSyncProfile } from './services/get-sync-profile';
export { ListSyncProfiles, listSyncProfiles } from './services/list-sync-profiles';
export { SetDefaultSyncProfile, setDefaultSyncProfile } from './services/set-default-sync-profile';

// ============================================================
// SyncSession Services
// ============================================================

export { StartSync, startSync } from './services/start-sync';
export { CancelSync, cancelSync } from './services/cancel-sync';
export { GetSyncSession, getSyncSession } from './services/get-sync-session';

// ============================================================
// PendingChange Services
// ============================================================

export { RecordPendingChange, recordPendingChange, type RecordChangeParams } from './services/record-pending-change';

// ============================================================
// SyncConflict Services
// ============================================================

export { RecordSyncConflict, recordSyncConflict, type CreateConflictParams } from './services/record-sync-conflict';
export { ResolveSyncConflict, resolveSyncConflict } from './services/resolve-sync-conflict';
