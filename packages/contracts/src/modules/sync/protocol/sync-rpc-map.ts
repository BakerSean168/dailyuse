import type {
  PullSyncRequest,
  PullSyncResponse,
  PushSyncRequest,
  PushSyncResponse,
  ResolveConflictsRequest,
  ResolveConflictsResponse,
  SyncStatusInfo,
} from '../api/index';

export type SyncRpcMap = {
  'sync:pull': [PullSyncRequest, PullSyncResponse];
  'sync:push': [PushSyncRequest, PushSyncResponse];
  'sync:resolve-conflicts': [ResolveConflictsRequest, ResolveConflictsResponse];
  'sync:get-status': [{ identityId: string }, SyncStatusInfo];
};
