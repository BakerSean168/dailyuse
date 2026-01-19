/**
 * Sync Application Service
 * @module application-client/sync
 */
import { SyncData, GetSyncStatus, ResolveSyncConflict } from './services';

export class SyncApplicationService {
  async syncData(): Promise<any> {
    return SyncData.getInstance().execute();
  }
  async getSyncStatus(): Promise<any> {
    return GetSyncStatus.getInstance().execute();
  }
  async resolveSyncConflict(conflictId: string, resolution: any): Promise<void> {
    return ResolveSyncConflict.getInstance().execute(conflictId, resolution);
  }
}

export const syncApplicationService = new SyncApplicationService();
