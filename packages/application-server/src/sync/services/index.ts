/**
 * Sync Services (Server)
 *
 * Server-side services for sync operations.
 * Each service represents a single business operation.
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

export { CreateSyncProfile, createSyncProfile } from './create-sync-profile';
export { UpdateSyncProfile, updateSyncProfile } from './update-sync-profile';
export { DeleteSyncProfile, deleteSyncProfile } from './delete-sync-profile';
export { GetSyncProfile, getSyncProfile } from './get-sync-profile';
export { ListSyncProfiles, listSyncProfiles } from './list-sync-profiles';
export { SetDefaultSyncProfile, setDefaultSyncProfile } from './set-default-sync-profile';

// ============================================================
// SyncSession Services
// ============================================================

export { StartSync, startSync } from './start-sync';
export { CancelSync, cancelSync } from './cancel-sync';
export { GetSyncSession, getSyncSession } from './get-sync-session';

// ============================================================
// PendingChange Services
// ============================================================

export { RecordPendingChange, recordPendingChange, type RecordChangeParams } from './record-pending-change';

// ============================================================
// SyncConflict Services
// ============================================================

export { RecordSyncConflict, recordSyncConflict, type CreateConflictParams } from './record-sync-conflict';
export { ResolveSyncConflict, resolveSyncConflict } from './resolve-sync-conflict';
