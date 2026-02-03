import type {
  StartSyncReq,
  StartSyncRes,
  CreateSyncProfileReq,
  CreateSyncProfileRes,
  UpdateSyncProfileReq,
  UpdateSyncProfileRes,
  GetSyncProfilesRes,
  ResolveSyncConflictReq,
} from '../api';

import type { SyncProfileClientDTO } from '../aggregates';
import type { SyncConflictClientDTO } from '../entities';

// === Sync Module RPC Map ===
export type SyncRpcMap = {
  // === Sync Operations ===
  'sync:start': [StartSyncReq, StartSyncRes];
  'sync:cancel': [{ sessionId: string }, void];
  'sync:get-status': [{ sessionId: string }, StartSyncRes];
  
  // === Profile Management ===
  'sync-profile:get-list': [void, GetSyncProfilesRes];
  'sync-profile:get': [{ profileId: string }, SyncProfileClientDTO];
  'sync-profile:create': [CreateSyncProfileReq, CreateSyncProfileRes];
  'sync-profile:update': [UpdateSyncProfileReq, UpdateSyncProfileRes];
  'sync-profile:delete': [{ profileId: string }, void];
  
  // === Conflict Management ===
  'sync-conflict:list': [{ profileId?: string }, { data: SyncConflictClientDTO[] }];
  'sync-conflict:resolve': [ResolveSyncConflictReq, void];
};
