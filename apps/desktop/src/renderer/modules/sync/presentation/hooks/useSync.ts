/**
 * useSync Hook
 *
 * 同步操作 Hook
 */

import { useState, useCallback } from 'react';
import { getSyncService } from '../../application/services';
import type {
  StartSyncRequest,
  StartSyncResponse,
  SyncTriggerType,
} from '@dailyuse/contracts/sync';

export interface UseSyncOperationsResult {
  syncing: boolean;
  error: Error | null;
  startSync: (profileId?: string) => Promise<StartSyncResponse>;
  cancelSync: (sessionId: string) => Promise<void>;
  retrySync: (sessionId: string) => Promise<StartSyncResponse>;
}

/**
 * Hook for sync operations (start, cancel, retry)
 */
export function useSync(): UseSyncOperationsResult {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const service = getSyncService();

  const startSync = useCallback(
    async (profileId?: string): Promise<StartSyncResponse> => {
      try {
        setSyncing(true);
        setError(null);
        const request: StartSyncRequest = {
          profileId,
          triggerType: 'manual' as SyncTriggerType,
        };
        const result = await service.start(request);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setSyncing(false);
      }
    },
    [service]
  );

  const cancelSync = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        setError(null);
        await service.cancel({ sessionId });
        setSyncing(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [service]
  );

  const retrySync = useCallback(
    async (sessionId: string): Promise<StartSyncResponse> => {
      try {
        setSyncing(true);
        setError(null);
        const result = await service.retry(sessionId);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setSyncing(false);
      }
    },
    [service]
  );

  return {
    syncing,
    error,
    startSync,
    cancelSync,
    retrySync,
  };
}
