/**
 * useAccount - 账户管理 Composable
 *
 * 通过 DI 注入的 AccountClientService 与后端交互。
 * Service 负责 API 调用，Composable 负责 Store 更新 + UI 状态。
 *
 * @module account/presentation/composables
 */

import { computed } from 'vue';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import type {
  UpdateAccountReq,
  CheckAvailabilityReq,
  CloseAccountReq,
  UpdateAccountSettingsReq,
  AccountClientDTO,
} from '@dailyuse/contracts/account';
import { useAccountStore } from '../stores/account-store';
import { useAuthenticationStore } from '../../authentication/stores/authentication-store';
import { ACCOUNT_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { AuthMode } from '@dailyuse/contracts/authentication';
import { translateResultError } from '../../../shared/utils/translate-result-error';

export function useAccount() {
  const accountStore = useAccountStore();
  const authStore = useAuthenticationStore();
  const accountService = useStrictInject(ACCOUNT_SERVICE_KEY, 'AccountService');
  const { t } = useI18n();

  // ========== Computed State ==========
  const currentAccount = computed(() => accountStore.currentAccount);
  const isLoading = computed(() => accountStore.isLoading);
  const error = computed(() => accountStore.error);
  const nickname = computed(() => accountStore.getNickname);
  const avatarUrl = computed(() => accountStore.getAvatarUrl);
  const email = computed(() => accountStore.getEmail);
  const isGuest = computed(() => authStore.authMode === AuthMode.GUEST);

  function getAccountErrorMessage(error: unknown, fallbackKey: string) {
    return translateResultError(error, t, { fallbackKey });
  }

  // ========== 资料管理 ==========

  async function loadMyProfile(): Promise<boolean> {
    if (authStore.authMode === AuthMode.GUEST) {
      // Create a mock profile for guest
      accountStore.setCurrentAccount({
        id: authStore.currentIdentity?.id as string,
        email: null,
        profile: {
          nickname: t('account.guestLabel'),
          bio: t('auth.page.guestMode'),
          avatarUrl: null,
        },
        settings: {
          theme: 'system',
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          currency: 'CNY',
        },
        status: 'Active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as unknown as AccountClientDTO);
      return true;
    }

    accountStore.setLoading(true);
    accountStore.setError(null);
    const result = await accountService.getMyProfile();
    accountStore.setLoading(false);
    if (result.ok) {
      accountStore.setCurrentAccount(result.data.toDTO());
      return true;
    } else {
      const message = getAccountErrorMessage(result.error, 'account.toast.loadProfileFailed');
      accountStore.setError(message);
      toast.error(t('account.toast.loadFailed'), { description: message });
      return false;
    }
  }

  async function updateMyProfile(req: UpdateAccountReq): Promise<boolean> {
    if (authStore.authMode === AuthMode.GUEST) {
      toast.error(t('account.toast.guestProfileUpdateUnavailable'));
      return false;
    }

    accountStore.setLoading(true);
    accountStore.setError(null);
    const result = await accountService.updateMyProfile(req);
    accountStore.setLoading(false);
    if (result.ok) {
      accountStore.setCurrentAccount(result.data.toDTO());
      toast.success(t('account.toast.profileUpdated'));
      return true;
    } else {
      const message = getAccountErrorMessage(result.error, 'account.toast.updateProfileFailed');
      accountStore.setError(message);
      toast.error(t('account.toast.updateFailed'), { description: message });
      return false;
    }
  }

  async function checkAvailability(req: CheckAvailabilityReq): Promise<boolean> {
    if (authStore.authMode === AuthMode.GUEST) {
      return false;
    }
    const result = await accountService.checkAvailability(req);
    if (result.ok) {
      return result.data.available;
    } else {
      const message = getAccountErrorMessage(result.error, 'account.toast.checkAvailabilityFailed');
      toast.error(t('account.toast.checkFailed'), { description: message });
      return false;
    }
  }

  async function updateSettings(req: UpdateAccountSettingsReq): Promise<boolean> {
    if (authStore.authMode === AuthMode.GUEST) {
      toast.error(t('account.toast.guestSettingsUpdateUnavailable'));
      return false;
    }
    accountStore.setLoading(true);
    accountStore.setError(null);
    const result = await accountService.updateSettings(req);
    accountStore.setLoading(false);
    if (result.ok) {
      const current = accountStore.currentAccount;
      if (current) {
        accountStore.setCurrentAccount({
          ...current,
          settings: result.data,
        });
      }
      toast.success(t('account.toast.settingsUpdated'));
      return true;
    }

    const message = getAccountErrorMessage(result.error, 'account.toast.updateFailed');
    accountStore.setError(message);
    toast.error(t('account.toast.updateFailed'), { description: message });
    return false;
  }

  async function closeAccount(req: CloseAccountReq): Promise<boolean> {
    if (authStore.authMode === AuthMode.GUEST) {
      toast.error(t('account.toast.guestCloseAccountUnavailable'));
      return false;
    }
    accountStore.setLoading(true);
    const result = await accountService.closeAccount(req);
    accountStore.setLoading(false);
    if (result.ok) {
      accountStore.clearCurrentAccount();
      toast.success(t('account.toast.accountClosed'));
      return true;
    } else {
      const message = getAccountErrorMessage(result.error, 'account.toast.closeAccountFailed');
      accountStore.setError(message);
      toast.error(t('account.toast.closeFailed'), { description: message });
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
    isGuest,

    // Actions
    loadMyProfile,
    updateMyProfile,
    checkAvailability,
    updateSettings,
    closeAccount,
  };
}
