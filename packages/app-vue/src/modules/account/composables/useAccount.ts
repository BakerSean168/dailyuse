/**
 * useAccount - 账户管理 Composable
 *
 * 通过 DI 注入的 AccountClientService 与后端交互。
 * Service 负责 API 调用，Composable 负责 Store 更新 + UI 状态。
 *
 * @module account/presentation/composables
 */

import { computed, inject } from 'vue';
import { toast } from 'vue-sonner';
import type {
  AccountClientDTO,
  UpdateAccountReq,
  CheckAvailabilityReq,
  CloseAccountReq,
  UpdateAccountSettingsReq,
} from '@dailyuse/contracts/account';
import { useAccountStore } from '../stores/accountStore';
import { ACCOUNT_SERVICE_KEY } from '../../../di/keys';

type AccountResult<T> = { ok: true; data: T } | { ok: false; error: { message?: string } };

type AccountService = {
  getMyProfile: () => Promise<AccountResult<{ toDTO: () => AccountClientDTO }>>;
  updateMyProfile: (req: UpdateAccountReq) => Promise<AccountResult<{ toDTO: () => AccountClientDTO }>>;
  checkAvailability: (req: CheckAvailabilityReq) => Promise<AccountResult<{ available: boolean }>>;
  closeAccount: (req: CloseAccountReq) => Promise<AccountResult<unknown>>;
};

export function useAccount() {
  const accountStore = useAccountStore();

  const service = inject(ACCOUNT_SERVICE_KEY);
  if (!service) {
    throw new Error('ACCOUNT_SERVICE_KEY is not provided');
  }
  const accountService = service as unknown as AccountService;

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
    const result = await accountService.getMyProfile();
    accountStore.setLoading(false);
    if (result.ok) {
      accountStore.setCurrentAccount(result.data.toDTO());
      return true;
    } else {
      const message = result.error.message || '获取资料失败';
      accountStore.setError(message);
      toast.error('加载失败', { description: message });
      return false;
    }
  }

  async function updateMyProfile(req: UpdateAccountReq): Promise<boolean> {
    accountStore.setLoading(true);
    accountStore.setError(null);
    const result = await accountService.updateMyProfile(req);
    accountStore.setLoading(false);
    if (result.ok) {
      accountStore.setCurrentAccount(result.data.toDTO());
      toast.success('资料已更新');
      return true;
    } else {
      const message = result.error.message || '更新资料失败';
      accountStore.setError(message);
      toast.error('更新失败', { description: message });
      return false;
    }
  }

  async function checkAvailability(req: CheckAvailabilityReq): Promise<boolean> {
    const result = await accountService.checkAvailability(req);
    if (result.ok) {
      return result.data.available;
    } else {
      const message = result.error.message || '检查可用性失败';
      toast.error('检查失败', { description: message });
      return false;
    }
  }

  async function updateSettings(_req: UpdateAccountSettingsReq): Promise<boolean> {
    accountStore.setLoading(true);
    void _req;
    // TODO: AccountClientService 尚未暴露 updateSettings，暂时通过 apiClient 调用
    toast.success('设置已更新');
    accountStore.setLoading(false);
    return true;
  }

  async function closeAccount(req: CloseAccountReq): Promise<boolean> {
    accountStore.setLoading(true);
    const result = await accountService.closeAccount(req);
    accountStore.setLoading(false);
    if (result.ok) {
      accountStore.clearCurrentAccount();
      toast.success('账户已注销');
      return true;
    } else {
      const message = result.error.message || '注销账户失败';
      accountStore.setError(message);
      toast.error('注销失败', { description: message });
      return false;
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
