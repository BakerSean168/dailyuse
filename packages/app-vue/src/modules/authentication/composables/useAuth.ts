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
} from '@dailyuse/contracts/authentication';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { AUTH_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';

export function useAuth() {
  const store = useAuthenticationStore();
  const router = useRouter();
  const service = useStrictInject(AUTH_SERVICE_KEY, 'AuthService');
  const { t } = useI18n();

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

  // ========== 登录 ==========

  async function loginByEmail(req: LoginByEmailReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.loginByEmail(req);
      store.setLoading(false);
      if (result.ok) {
        handleAuthSuccess(result.data);
        toast.success(t('auth.toast.loginSuccess'), { description: t('auth.toast.welcomeBack') });
        router.push('/');
        return true;
      }
      const message = result.error?.message || t('auth.toast.loginFailed');
      store.setError(message);
      toast.error(t('auth.toast.loginFailed'), { description: message });
      return false;
    } catch (e) {
      store.setLoading(false);
      const message = t('auth.toast.loginFailed');
      store.setError(message);
      toast.error(message, { description: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  async function loginByPhone(req: LoginByPhoneReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.loginByPhone(req);
      store.setLoading(false);
      if (result.ok) {
        handleAuthSuccess(result.data);
        toast.success(t('auth.toast.loginSuccess'), { description: t('auth.toast.welcomeBack') });
        router.push('/');
        return true;
      }
      const message = result.error?.message || t('auth.toast.loginFailed');
      store.setError(message);
      toast.error(t('auth.toast.loginFailed'), { description: message });
      return false;
    } catch (e) {
      store.setLoading(false);
      const message = t('auth.toast.loginFailed');
      store.setError(message);
      toast.error(message, { description: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  // ========== 注册 ==========

  async function registerByEmail(req: RegisterByEmailReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.registerByEmail(req);
      store.setLoading(false);
      if (result.ok) {
        handleAuthSuccess(result.data);
        toast.success(t('auth.toast.registerSuccess'), {
          description: t('auth.toast.welcomeJoin'),
        });
        router.push('/');
        return true;
      }
      const message = result.error?.message || t('auth.toast.registerFailed');
      store.setError(message);
      toast.error(t('auth.toast.registerFailed'), { description: message });
      return false;
    } catch (e) {
      store.setLoading(false);
      const message = t('auth.toast.registerFailed');
      store.setError(message);
      toast.error(message, { description: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  async function registerByPhone(req: RegisterByPhoneReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await service.registerByPhone(req);
      store.setLoading(false);
      if (result.ok) {
        handleAuthSuccess(result.data);
        toast.success(t('auth.toast.registerSuccess'), {
          description: t('auth.toast.welcomeJoin'),
        });
        router.push('/');
        return true;
      }
      const message = result.error?.message || t('auth.toast.registerFailed');
      store.setError(message);
      toast.error(t('auth.toast.registerFailed'), { description: message });
      return false;
    } catch (e) {
      store.setLoading(false);
      const message = t('auth.toast.registerFailed');
      store.setError(message);
      toast.error(message, { description: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  // ========== 验证码 ==========

  async function sendSmsCode(
    phoneNumber: string,
    purpose: SendSmsCodeReq['purpose'] = 'LOGIN',
  ): Promise<boolean> {
    const result = await service.sendSmsCode({ phoneNumber, purpose });
    if (result.ok) {
      toast.success(t('auth.toast.smsCodeSent'), { description: t('auth.toast.checkSms') });
      return true;
    }
    const message = result.error.message || t('auth.toast.smsCodeFailed');
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
      router.push('/auth');
    }
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
    sendSmsCode,
    refreshToken,
    logout,
  };
}
