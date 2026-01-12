/**
 * useAccount Hook
 *
 * 账户管理 Hook
 * Story-008: Auth & Account UI
 * 
 * 使用 @dailyuse/application-client 的 Use Case 实现 DDD 架构
 * application-client 已返回 Entity 对象
 */

import { useState, useEffect, useCallback } from 'react';
import {
  GetMyProfile,
  UpdateMyProfile,
  UpdateAccountPreferences,
  ChangeMyPassword,
} from '@dailyuse/application-client';
import type { UpdateAccountPreferencesRequestDTO, UpdateAccountProfileRequestDTO } from '@dailyuse/contracts/account';
import type { Account } from '@dailyuse/domain-client/account';

interface AccountState {
  account: Account | null;
  loading: boolean;
  error: string | null;
}

interface UseAccountReturn extends AccountState {
  // Profile
  loadProfile: () => Promise<void>;
  updateProfile: (request: UpdateAccountProfileRequestDTO) => Promise<void>;
  
  // Preferences
  updatePreferences: (request: UpdateAccountPreferencesRequestDTO) => Promise<void>;
  
  // Password
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // Utilities
  clearError: () => void;
  refresh: () => Promise<void>;
}

export function useAccount(): UseAccountReturn {
  const [state, setState] = useState<AccountState>({
    account: null,
    loading: false,
    error: null,
  });

  // Load profile
  const loadProfile = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 使用 application-client Service Class
      const account = await GetMyProfile.getInstance().execute();
      setState((prev) => ({ ...prev, account, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '加载账户失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Update profile
  const updateProfileFn = useCallback(
    async (request: UpdateAccountProfileRequestDTO) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 使用 application-client Service Class
        const account = await UpdateMyProfile.getInstance().execute(request);
        setState((prev) => ({ ...prev, account, loading: false }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '更新资料失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [],
  );

  // Update preferences
  const updatePreferencesFn = useCallback(
    async (request: UpdateAccountPreferencesRequestDTO) => {
      if (!state.account?.uuid) {
        setState((prev) => ({
          ...prev,
          error: '请先登录',
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 使用 application-client Service Class
        const account = await UpdateAccountPreferences.getInstance().execute(
          state.account.uuid,
          request,
        );
        setState((prev) => ({ ...prev, account, loading: false }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '更新偏好设置失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [state.account?.uuid],
  );

  // Change password
  const changePasswordFn = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 使用 application-client Service Class
        await ChangeMyPassword.getInstance().execute({ currentPassword, newPassword });
        setState((prev) => ({ ...prev, loading: false }));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '修改密码失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [],
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    account: state.account,
    loading: state.loading,
    error: state.error,
    loadProfile,
    updateProfile: updateProfileFn,
    updatePreferences: updatePreferencesFn,
    changePassword: changePasswordFn,
    clearError,
    refresh,
  };
}

export type { AccountState, UseAccountReturn };
export default useAccount;
