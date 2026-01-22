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

export { CreateSyncProfile } from './services/create-sync-profile';
export { UpdateSyncProfile } from './services/update-sync-profile';
export { DeleteSyncProfile } from './services/delete-sync-profile';
export { GetSyncProfile } from './services/get-sync-profile';
export { ListSyncProfiles } from './services/list-sync-profiles';
export { SetDefaultSyncProfile } from './services/set-default-sync-profile';

// ============================================================
// SyncSession Services
// ============================================================

export { StartSync } from './services/start-sync';
export { CancelSync } from './services/cancel-sync';
export { GetSyncSession } from './services/get-sync-session';

// ============================================================
// PendingChange Services
// ============================================================

export { RecordPendingChange, type RecordChangeParams } from './services/record-pending-change';

// ============================================================
// SyncConflict Services
// ============================================================

export { RecordSyncConflict, type CreateConflictParams } from './services/record-sync-conflict';
export { ResolveSyncConflict } from './services/resolve-sync-conflict';
