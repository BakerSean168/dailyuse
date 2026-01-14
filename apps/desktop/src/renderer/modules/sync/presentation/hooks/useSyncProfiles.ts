/**
 * useSyncProfiles Hook
 *
 * 同步配置管理 Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { getSyncService } from '../../application/services';
import type {
  SyncProfileClientDTO,
  SyncProfileListResponse,
  CreateSyncProfileRequest,
  UpdateSyncProfileRequest,
} from '@dailyuse/contracts/sync';

export interface UseSyncProfilesResult {
  profiles: SyncProfileClientDTO[];
  activeProfileId: string | undefined;
  defaultProfileId: string | undefined;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createProfile: (request: CreateSyncProfileRequest) => Promise<SyncProfileClientDTO>;
  updateProfile: (request: UpdateSyncProfileRequest) => Promise<SyncProfileClientDTO>;
  deleteProfile: (profileId: string) => Promise<void>;
  setDefaultProfile: (profileId: string) => Promise<SyncProfileClientDTO>;
  activateProfile: (profileId: string) => Promise<SyncProfileClientDTO>;
}

/**
 * Hook for managing sync profiles
 */
export function useSyncProfiles(): UseSyncProfilesResult {
  const [data, setData] = useState<SyncProfileListResponse>({
    profiles: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const service = getSyncService();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await service.listProfiles();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createProfile = useCallback(
    async (request: CreateSyncProfileRequest): Promise<SyncProfileClientDTO> => {
      const profile = await service.addProfile(request);
      await refresh();
      return profile;
    },
    [service, refresh]
  );

  const updateProfile = useCallback(
    async (request: UpdateSyncProfileRequest): Promise<SyncProfileClientDTO> => {
      const profile = await service.editProfile(request);
      await refresh();
      return profile;
    },
    [service, refresh]
  );

  const deleteProfile = useCallback(
    async (profileId: string): Promise<void> => {
      await service.removeProfile(profileId);
      await refresh();
    },
    [service, refresh]
  );

  const setDefaultProfile = useCallback(
    async (profileId: string): Promise<SyncProfileClientDTO> => {
      const profile = await service.setAsDefault(profileId);
      await refresh();
      return profile;
    },
    [service, refresh]
  );

  const activateProfile = useCallback(
    async (profileId: string): Promise<SyncProfileClientDTO> => {
      const profile = await service.activate(profileId);
      await refresh();
      return profile;
    },
    [service, refresh]
  );

  return {
    profiles: data.profiles,
    activeProfileId: data.activeProfileId,
    defaultProfileId: data.defaultProfileId,
    loading,
    error,
    refresh,
    createProfile,
    updateProfile,
    deleteProfile,
    setDefaultProfile,
    activateProfile,
  };
}
