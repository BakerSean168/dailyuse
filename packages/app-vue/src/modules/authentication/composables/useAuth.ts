/**
 * useAuth - 核心认证 Composable
 *
 * 通过 DI 注入的 AuthClientService 与后端交互。
 * Service 返回 Result<T>，Composable 负责 Result 解包 + Store 更新 + UI 状态。
 *
 * @module authentication/composables
 */

import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import type {
  LoginByEmailReq,
  LoginByPhoneReq,
  RegisterByEmailReq,
  RegisterByPhoneReq,
  SendSmsCodeReq,
  AuthResponseDTO,
  RememberedDesktopAccountDTO,
} from '@dailyuse/contracts/authentication';
import { AuthMode } from '@dailyuse/contracts/authentication';
import { WindowChannels } from '@dailyuse/contracts/electron';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { AUTH_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import { translateResultError } from '../../../shared/utils/translateResultError';

export function useAuth() {
  const store = useAuthenticationStore();
  const router = useRouter();
  const service = useStrictInject(AUTH_SERVICE_KEY, 'AuthService');
  const { t } = useI18n();

  const hasDesktopWindowBridge = () =>
    typeof window !== 'undefined' && typeof (window as any).electronAPI?.invoke === 'function';

  const redirectWithReload = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.replace(path);
      return;
    }

    void router.push(path);
  };

  async function completeAuthSuccess(
    data: AuthResponseDTO,
    title: string,
    description: string,
  ): Promise<boolean> {
    handleAuthSuccess(data);
    toast.success(title, { description });

    if (hasDesktopWindowBridge()) {
      await (window as any).electronAPI!.invoke(WindowChannels.TRANSITION_TO_MAIN);
      return true;
    }

    redirectWithReload('/');
    return true;
  }

  // ========== Computed State ==========
  const isAuthenticated = computed(() => store.isAuthenticated);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const currentIdentity = computed(() => store.currentIdentity);
  const accessToken = computed(() => store.accessToken);

  // ========== 认证响应统一处理 ==========
  function handleAuthSuccess(data: AuthResponseDTO) {
    store.handleAuthResponse(data);
    store.setError(null);
  }

  function getLocalizedAuthError(
    errorLike: unknown,
    fallbackKey: string,
  ): string {
    return translateResultError(errorLike, t, {
      scope: 'auth',
      fallbackKey,
    });
  }

  // ========== 登录 ==========

  async function loginByEmail(req: LoginByEmailReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.loginByEmail(req);
      if (result.ok) {
        return await completeAuthSuccess(
          result.data,
          t('auth.toast.loginSuccess'),
          t('auth.toast.welcomeBack'),
        );
      }
      const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
      store.setError(message);
      toast.error(t('auth.toast.loginFailed'), { description: message });
      return false;
    } catch (e) {
      store.setLoading(false);
      console.error('[auth] loginByEmail failed', e);
      const description = getLocalizedAuthError(e, 'auth.errors.UNKNOWN');
      store.setError(description);
      toast.error(t('auth.toast.loginFailed'), { description });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  async function loginByPhone(req: LoginByPhoneReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.loginByPhone(req);
      if (result.ok) {
        return await completeAuthSuccess(
          result.data,
          t('auth.toast.loginSuccess'),
          t('auth.toast.welcomeBack'),
        );
      }
      const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
      store.setError(message);
      toast.error(t('auth.toast.loginFailed'), { description: message });
      return false;
    } catch (e) {
      store.setLoading(false);
      console.error('[auth] loginByPhone failed', e);
      const description = getLocalizedAuthError(e, 'auth.errors.UNKNOWN');
      store.setError(description);
      toast.error(t('auth.toast.loginFailed'), { description });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  // ========== 注册 ==========

  async function registerByEmail(req: RegisterByEmailReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.registerByEmail(req);
      if (result.ok) {
        return await completeAuthSuccess(
          result.data,
          t('auth.toast.registerSuccess'),
          t('auth.toast.welcomeJoin'),
        );
      }
      const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
      store.setError(message);
      toast.error(t('auth.toast.registerFailed'), { description: message });
      return false;
    } catch (e) {
      store.setLoading(false);
      console.error('[auth] registerByEmail failed', e);
      const description = getLocalizedAuthError(e, 'auth.errors.UNKNOWN');
      store.setError(description);
      toast.error(t('auth.toast.registerFailed'), { description });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  async function registerByPhone(req: RegisterByPhoneReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.registerByPhone(req);
      if (result.ok) {
        return await completeAuthSuccess(
          result.data,
          t('auth.toast.registerSuccess'),
          t('auth.toast.welcomeJoin'),
        );
      }
      const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
      store.setError(message);
      toast.error(t('auth.toast.registerFailed'), { description: message });
      return false;
    } catch (e) {
      store.setLoading(false);
      console.error('[auth] registerByPhone failed', e);
      const description = getLocalizedAuthError(e, 'auth.errors.UNKNOWN');
      store.setError(description);
      toast.error(t('auth.toast.registerFailed'), { description });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  // ========== 验证码 ==========

  async function sendSmsCode(
    phoneNumber: string,
    purpose: SendSmsCodeReq['purpose'] = 'Login',
  ): Promise<boolean> {
    const result = await service.sendSmsCode({ phoneNumber, purpose });
    if (result.ok) {
      toast.success(t('auth.toast.smsCodeSent'), { description: t('auth.toast.checkSms') });
      return true;
    }
    const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
    toast.error(t('auth.toast.sendFailed'), { description: message });
    return false;
  }

  // ========== 令牌刷新 ==========

  async function refreshToken(): Promise<boolean> {
    const currentRefreshToken = store.refreshToken;
    if (!currentRefreshToken) return false;

    const result = await service.refreshToken({ refreshToken: currentRefreshToken });
    if (result.ok) {
      handleAuthSuccess(result.data);
      return true;
    }
    console.error('Token refresh failed:', result.error.message);
    // 刷新失败，清除认证状态
    store.reset();
    return false;
  }

  // ========== 登出 ==========

  async function logout(): Promise<void> {
    try {
      if (store.accessToken) {
        const result = await service.logout();
        if (!result.ok) {
          console.warn('Logout API call failed:', result.error.message);
        }
      }
    } finally {
      store.reset();
      toast.success(t('auth.toast.loggedOut'));
      if (hasDesktopWindowBridge()) {
        await (window as any).electronAPI!.invoke(WindowChannels.TRANSITION_TO_LOGIN);
      } else {
        redirectWithReload('/auth');
      }
    }
  }

  // ========== 访客模式 (Desktop Only) ==========

  async function enterGuestMode(): Promise<boolean> {
    if (!hasDesktopWindowBridge()) {
      toast.error(t('auth.toast.guestModeFailed'), {
        description: t('auth.validation.guestModeUnavailable'),
      });
      return false;
    }

    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.enterGuestMode();
      if (result.ok) {
        const currentUser = await service.getCurrentUser();
        if (!currentUser.ok) {
          const message = getLocalizedAuthError(currentUser.error, 'auth.errors.UNKNOWN');
          store.setError(message);
          toast.error(t('auth.toast.guestModeFailed'), { description: message });
          return false;
        }

        store.setCurrentIdentity(currentUser.data.identity);
        store.setCurrentSession(currentUser.data.session);
        store.setAuthMode(AuthMode.GUEST);
        store.setAccessToken('guest-local-token');
        store.setRefreshToken('guest-local-token');
        toast.success(t('auth.toast.guestModeEntered'), {
          description: t('auth.toast.guestModeLocalOnly'),
        });
        await (window as any).electronAPI!.invoke(WindowChannels.TRANSITION_TO_MAIN);
        return true;
      }
      const message = getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN');
      store.setError(message);
      toast.error(t('auth.toast.guestModeFailed'), { description: message });
      return false;
    } catch (e) {
      console.error('[auth] enterGuestMode failed', e);
      const message = getLocalizedAuthError(e, 'auth.errors.UNKNOWN');
      store.setError(message);
      toast.error(t('auth.toast.guestModeFailed'), { description: message });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  async function listRememberedAccounts(): Promise<RememberedDesktopAccountDTO[]> {
    const result = await service.listRememberedAccounts();
    if (result.ok) {
      return result.data;
    }
    return [];
  }

  async function removeRememberedAccount(identityId: string): Promise<boolean> {
    const result = await service.removeRememberedAccount(identityId);
    if (result.ok) {
      return true;
    }

    toast.error(t('auth.toast.removeRememberedAccountFailed'), {
      description: getLocalizedAuthError(result.error, 'auth.errors.UNKNOWN'),
    });
    return false;
  }

  return {
    // State
    isAuthenticated,
    isLoading,
    error,
    currentIdentity,
    accessToken,

    // Actions
    loginByEmail,
    loginByPhone,
    registerByEmail,
    registerByPhone,
    enterGuestMode,
    listRememberedAccounts,
    removeRememberedAccount,
    sendSmsCode,
    refreshToken,
    logout,
  };
}
