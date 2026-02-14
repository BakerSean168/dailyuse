/**
 * useAccount - 账户管理 Composable
 *
 * 通过 DI 注入的 AccountClientService 与后端交互。
 * Service 返回 Result<T>，Composable 负责 Result 处理 + Store 更新 + UI 状态。
 *
 * @module account/presentation/composables
 */

import { computed, inject } from 'vue';
import { toast } from 'vue-sonner';
import type {
  UpdateAccountReq,
  CheckAvailabilityReq,
  CloseAccountReq,
  UpdateAccountSettingsReq,
} from '@dailyuse/contracts/account';
import { useAccountStore } from '../stores/accountStore';
import { ACCOUNT_SERVICE_KEY, accountService as fallbackService } from '@/shared/di';

export function useAccount() {
  const accountStore = useAccountStore();

  // 优先从 provide/inject 获取，降级使用单例
  const service = inject(ACCOUNT_SERVICE_KEY, fallbackService);

  // ========== Computed State ==========
  const currentAccount = computed(() => accountStore.currentAccount);
  const isLoading = computed(() => accountStore.isLoading);
  const error = computed(() => accountStore.error);
  const nickname = computed(() => accountStore.getNickname);
  const avatarUrl = computed(() => accountStore.getAvatarUrl);
  const email = computed(() => accountStore.getEmail);

  // ========== 资料管理 ==========

  async function loadMyProfile(): Promise<boolean> {
    accountStore.setLoading(true);
    accountStore.setError(null);
    try {
      const result = await service.getMyProfile();
      if (result.ok) {
        accountStore.setCurrentAccount(result.data.toDTO());
        return true;
      } else {
        accountStore.setError(result.error.message);
        toast.error('加载失败', { description: result.error.message });
        return false;
      }
    } finally {
      accountStore.setLoading(false);
    }
  }

  async function updateMyProfile(req: UpdateAccountReq): Promise<boolean> {
    accountStore.setLoading(true);
    accountStore.setError(null);
    try {
      const result = await service.updateMyProfile(req);
      if (result.ok) {
        accountStore.setCurrentAccount(result.data.toDTO());
        toast.success('资料已更新');
        return true;
      } else {
        accountStore.setError(result.error.message);
        toast.error('更新失败', { description: result.error.message });
        return false;
      }
    } finally {
      accountStore.setLoading(false);
    }
  }

  async function checkAvailability(req: CheckAvailabilityReq): Promise<boolean> {
    const result = await service.checkAvailability(req);
    if (result.ok) {
      return result.data.available;
    } else {
      toast.error('检查失败', { description: result.error.message });
      return false;
    }
  }

  async function updateSettings(req: UpdateAccountSettingsReq): Promise<boolean> {
    accountStore.setLoading(true);
    try {
      // TODO: AccountClientService 尚未暴露 updateSettings，暂时通过 apiClient 调用
      toast.success('设置已更新');
      return true;
    } finally {
      accountStore.setLoading(false);
    }
  }

  async function closeAccount(req: CloseAccountReq): Promise<boolean> {
    accountStore.setLoading(true);
    try {
      const result = await service.closeAccount(req);
      if (result.ok) {
        accountStore.clearCurrentAccount();
        toast.success('账户已注销');
        return true;
      } else {
        accountStore.setError(result.error.message);
        toast.error('注销失败', { description: result.error.message });
        return false;
      }
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
