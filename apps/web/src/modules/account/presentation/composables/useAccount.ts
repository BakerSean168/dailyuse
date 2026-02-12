/**
 * useAccount - 账户管理 Composable
 *
 * 处理账户资料获取、更新、注销等操作。
 * 通过 accountApi 服务直接调用 API，使用 store 管理状态。
 *
 * @module account/presentation/composables
 */

import { computed } from 'vue';
import { toast } from 'vue-sonner';
import type {
  UpdateAccountReq,
  CheckAvailabilityReq,
  CloseAccountReq,
  UpdateAccountSettingsReq,
} from '@dailyuse/contracts/account';
import { useAccountStore } from '../stores/accountStore';
import { useAuthenticationStore } from '@/modules/authentication/presentation/stores/authenticationStore';
import { accountApi, AccountApiError } from '../services/accountApi';

export function useAccount() {
  const accountStore = useAccountStore();
  const authStore = useAuthenticationStore();

  // ========== Computed State ==========
  const currentAccount = computed(() => accountStore.currentAccount);
  const isLoading = computed(() => accountStore.isLoading);
  const error = computed(() => accountStore.error);
  const nickname = computed(() => accountStore.getNickname);
  const avatarUrl = computed(() => accountStore.getAvatarUrl);
  const email = computed(() => accountStore.getEmail);

  // ========== 获取 accessToken ==========
  function getToken(): string | null {
    return authStore.accessToken;
  }

  // ========== 资料管理 ==========

  async function loadMyProfile(): Promise<boolean> {
    const token = getToken();
    if (!token) return false;

    accountStore.setLoading(true);
    accountStore.setError(null);
    try {
      const account = await accountApi.getMyProfile(token);
      accountStore.setCurrentAccount(account);
      return true;
    } catch (err) {
      const message = err instanceof AccountApiError ? err.message : '获取资料失败';
      accountStore.setError(message);
      toast.error('加载失败', { description: message });
      return false;
    } finally {
      accountStore.setLoading(false);
    }
  }

  async function updateMyProfile(req: UpdateAccountReq): Promise<boolean> {
    const token = getToken();
    if (!token) return false;

    accountStore.setLoading(true);
    accountStore.setError(null);
    try {
      const updated = await accountApi.updateMyProfile(req, token);
      accountStore.setCurrentAccount(updated);
      toast.success('资料已更新');
      return true;
    } catch (err) {
      const message = err instanceof AccountApiError ? err.message : '更新资料失败';
      accountStore.setError(message);
      toast.error('更新失败', { description: message });
      return false;
    } finally {
      accountStore.setLoading(false);
    }
  }

  async function checkAvailability(req: CheckAvailabilityReq): Promise<boolean> {
    const token = getToken();
    if (!token) return false;

    try {
      const result = await accountApi.checkAvailability(req, token);
      return result.available;
    } catch (err) {
      const message = err instanceof AccountApiError ? err.message : '检查可用性失败';
      toast.error('检查失败', { description: message });
      return false;
    }
  }

  async function updateSettings(req: UpdateAccountSettingsReq): Promise<boolean> {
    const token = getToken();
    if (!token) return false;

    accountStore.setLoading(true);
    try {
      await accountApi.updateSettings(req, token);
      toast.success('设置已更新');
      return true;
    } catch (err) {
      const message = err instanceof AccountApiError ? err.message : '更新设置失败';
      accountStore.setError(message);
      toast.error('更新失败', { description: message });
      return false;
    } finally {
      accountStore.setLoading(false);
    }
  }

  async function closeAccount(req: CloseAccountReq): Promise<boolean> {
    const token = getToken();
    if (!token) return false;

    accountStore.setLoading(true);
    try {
      await accountApi.closeAccount(req, token);
      accountStore.clearCurrentAccount();
      toast.success('账户已注销');
      return true;
    } catch (err) {
      const message = err instanceof AccountApiError ? err.message : '注销账户失败';
      accountStore.setError(message);
      toast.error('注销失败', { description: message });
      return false;
    } finally {
      accountStore.setLoading(false);
    }
  }

  return {
    // State
    currentAccount,
    isLoading,
    error,
    nickname,
    avatarUrl,
    email,

    // Actions
    loadMyProfile,
    updateMyProfile,
    checkAvailability,
    updateSettings,
    closeAccount,
  };
}
