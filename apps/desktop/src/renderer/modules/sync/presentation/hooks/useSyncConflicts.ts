/**
 * useSyncConflicts Hook
 *
 * 同步冲突管理 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { syncApplicationService } from '@dailyuse/sync/application-client';
import type {
  SyncConflictClientDTO,
  ResolveConflictRequest,
  ConflictResolutionDTO,
  ConflictResolutionStrategy,
} from '@dailyuse/contracts/sync';

export interface UseSyncConflictsResult {
  conflicts: SyncConflictClientDTO[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  resolveConflict: (request: ResolveConflictRequest) => Promise<void>;
  resolveAll: (resolution: 'local' | 'remote') => Promise<void>;
}

/**
 * Hook for managing sync conflicts
 */
export function useSyncConflicts(): UseSyncConflictsResult {
  const [conflicts, setConflicts] = useState<SyncConflictClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await syncApplicationService.listConflicts();
      setConflicts(result.conflicts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const resolveConflict = useCallback(
    async (request: ResolveConflictRequest): Promise<void> => {
      await syncApplicationService.resolve(request);
      await refresh();
    },
    [refresh],
  );

  const resolveAll = useCallback(
    async (resolution: 'local' | 'remote'): Promise<void> => {
      const isLocal = resolution === 'local';
      const strategy: ConflictResolutionStrategy = isLocal
        ? ('LOCAL_WINS' as ConflictResolutionStrategy)
        : ('REMOTE_WINS' as ConflictResolutionStrategy);

      for (const conflict of conflicts) {
        const resolutionDTO: ConflictResolutionDTO = {
          strategy,
          selectedVersion: isLocal ? 'local' : 'remote',
          resolvedData: isLocal ? conflict.localData : conflict.remoteData,
          resolvedAt: Date.now(),
          resolvedBy: 'user',
        };
        await syncApplicationService.resolve({
          conflictId: conflict.id,
          resolution: resolutionDTO,
        });
      }
      await refresh();
    },
    [conflicts, refresh],
  );

  return {
    conflicts,
    loading,
    error,
    refresh,
    resolveConflict,
    resolveAll,
  };
}
