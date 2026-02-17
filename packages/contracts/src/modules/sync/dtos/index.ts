import type { PullSyncResponse, PushSyncResponse, SyncStatusInfo } from '../api/index';

export interface SyncOverviewDTO {
  pull: PullSyncResponse;
  push: PushSyncResponse;
  status: SyncStatusInfo;
}
