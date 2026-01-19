/**
 * useSyncStatus Hook
 *
 * 同步状态 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { syncApplicationService } from '@dailyuse/application-client/sync';
import type { SyncStatusResponse } from '@dailyuse/contracts/sync';

export interface UseSyncStatusResult {
  status: SyncStatusResponse | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for sync status
 */
export function useSyncStatus(): UseSyncStatusResult {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await syncApplicationService.getStatus();
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Refresh every 30 seconds
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { status, loading, error, refresh };
}
