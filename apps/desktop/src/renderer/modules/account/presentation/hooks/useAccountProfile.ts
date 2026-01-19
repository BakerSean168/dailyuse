/**
 * useAccountProfile Hook
 *
 * 账户资料专用 Hook - 更细粒度的资料管理
 */

import { useState, useCallback } from 'react';
import { accountApplicationService } from '@dailyuse/application-client/account';
import type { AccountClientDTO, AccountStatsResponseDTO } from '@dailyuse/contracts/account';

export interface UseAccountProfileReturn {
  // State
  profile: AccountClientDTO | null;
  stats: AccountStatsResponseDTO | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadProfile: (accountId: string) => Promise<void>;
  loadStats: () => Promise<void>;
}

export function useAccountProfile(): UseAccountProfileReturn {
  const [profile, setProfile] = useState<AccountClientDTO | null>(null);
  const [stats, setStats] = useState<AccountStatsResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (accountId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await accountApplicationService.getAccountById(accountId);
      // Convert Entity to DTO for storage
      setProfile(result ? result.toClientDTO() : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载资料失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await accountApplicationService.getAccountStats();
      setStats(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载统计失败');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    stats,
    loading,
    error,
    loadProfile,
    loadStats,
  };
}

export default useAccountProfile;
