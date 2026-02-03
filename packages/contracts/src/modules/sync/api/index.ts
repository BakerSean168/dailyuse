/**
 * Sync Module API Contracts (Grouped by operation type)
 */

// === Sync Profile Operations ===
export {
  CreateSyncProfileSchema,
  UpdateSyncProfileSchema,
  GetSyncProfileSchema,
  DeleteSyncProfileSchema,
} from './crud';
export type {
  CreateSyncProfileReq,
  CreateSyncProfileRes,
  UpdateSyncProfileReq,
  UpdateSyncProfileRes,
  GetSyncProfilesReq,
  GetSyncProfilesRes,
  GetSyncProfileReq,
  GetSyncProfileRes,
  DeleteSyncProfileReq,
  DeleteSyncProfileRes,
} from './crud';

// === Sync Operation ===
export {
  StartSyncSchema,
  CancelSyncSchema,
  GetSyncStatusSchema,
} from './crud';
export type {
  StartSyncReq,
  StartSyncRes,
  CancelSyncReq,
  CancelSyncRes,
  GetSyncStatusReq,
  GetSyncStatusRes,
} from './crud';

// === Sync Conflict Resolution ===
export {
  ResolveSyncConflictSchema,
  IgnoreSyncConflictSchema,
  AutoResolveSyncConflictsSchema,
} from './crud';
export type {
  GetSyncConflictsReq,
  GetSyncConflictsRes,
  ResolveSyncConflictReq,
  ResolveSyncConflictRes,
  IgnoreSyncConflictReq,
  IgnoreSyncConflictRes,
  AutoResolveSyncConflictsReq,
  AutoResolveSyncConflictsRes,
} from './crud';

// === Sync History ===
export {
  GetSyncHistorySchema,
} from './crud';
export type {
  GetSyncHistoryReq,
  GetSyncHistoryRes,
  SyncHistoryItem,
} from './crud';

// === Data Export/Import ===
export {
  ExportSyncDataSchema,
  ImportSyncDataSchema,
} from './crud';
export type {
  ExportSyncDataReq,
  ExportSyncDataRes,
  ImportSyncDataReq,
  ImportSyncDataRes,
} from './crud';
