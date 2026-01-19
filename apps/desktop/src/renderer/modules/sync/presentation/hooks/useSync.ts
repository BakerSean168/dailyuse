/**
 * useSync Hook
 *
 * 同步操作 Hook
 */

import { useState, useCallback } from 'react';
import { syncApplicationService } from '@dailyuse/application-client/sync';
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

  const startSync = useCallback(async (profileId?: string): Promise<StartSyncResponse> => {
    try {
      setSyncing(true);
      setError(null);
      const request: StartSyncRequest = {
        profileId,
        triggerType: 'manual' as SyncTriggerType,
      };
      const result = await syncApplicationService.start(request);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, []);

  const cancelSync = useCallback(async (sessionId: string): Promise<void> => {
    try {
      setError(null);
      await syncApplicationService.cancel({ sessionId });
      setSyncing(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const retrySync = useCallback(async (sessionId: string): Promise<StartSyncResponse> => {
    try {
      setSyncing(true);
      setError(null);
      const result = await syncApplicationService.retry(sessionId);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, []);

  return {
    syncing,
    error,
    startSync,
    cancelSync,
    retrySync,
  };
}
