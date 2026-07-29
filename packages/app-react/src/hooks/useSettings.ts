import { useEffect, useState } from 'react';

import type { PreferenceCategory, UserSettingClientDTO } from '@memoflow/contracts/setting';

import { useAppSession } from './useAppSession';
import { useSettingService } from './useSettingService';

export function useSettings() {
  const service = useSettingService();
  const { isRemoteAuthenticated } = useAppSession();
  const [settings, setSettings] = useState<UserSettingClientDTO | null>(null);
  const [isLoading, setIsLoading] = useState(isRemoteAuthenticated);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!isRemoteAuthenticated) {
      setSettings(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await service.getUserSettings();
    if (!result.ok) {
      setSettings(null);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setSettings(result.data);
    setIsLoading(false);
  }

  useEffect(() => {
    void load();
  }, [isRemoteAuthenticated]);

  async function refresh() {
    await load();
  }

  async function patchCategory(category: PreferenceCategory, patch: Record<string, unknown>) {
    setIsMutating(true);
    setError(null);

    const result = await service.patchCategory(category, patch);
    setIsMutating(false);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    setSettings(result.data);
    return true;
  }

  async function resetCategory(category?: PreferenceCategory) {
    setIsMutating(true);
    setError(null);

    const result = await service.resetUserSettings(category);
    setIsMutating(false);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    setSettings(result.data);
    return true;
  }

  return {
    error,
    isLoading,
    isMutating,
    isRemoteAuthenticated,
    patchCategory,
    refresh,
    resetCategory,
    settings,
  };
}
