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
    const result = await service.loginByEmail(req);
    store.setLoading(false);
    if (result.ok) {
      handleAuthSuccess(result.data);
      toast.success('登录成功', { description: '欢迎回来！' });
      router.push('/');
      return true;
    }
    const message = result.error.message || '登录失败';
    store.setError(message);
    toast.error('登录失败', { description: message });
    return false;
  }

  async function loginByPhone(req: LoginByPhoneReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    const result = await service.loginByPhone(req);
    store.setLoading(false);
    if (result.ok) {
      handleAuthSuccess(result.data);
      toast.success('登录成功', { description: '欢迎回来！' });
      router.push('/');
      return true;
    }
    const message = result.error.message || '登录失败';
    store.setError(message);
    toast.error('登录失败', { description: message });
    return false;
  }

  // ========== 注册 ==========

  async function registerByEmail(req: RegisterByEmailReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    const result = await service.registerByEmail(req);
    store.setLoading(false);
    if (result.ok) {
      handleAuthSuccess(result.data);
      toast.success('注册成功', { description: '欢迎加入！' });
      router.push('/');
      return true;
    }
    const message = result.error.message || '注册失败';
    store.setError(message);
    toast.error('注册失败', { description: message });
    return false;
  }

  async function registerByPhone(req: RegisterByPhoneReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    const result = await service.registerByPhone(req);
    store.setLoading(false);
    if (result.ok) {
      handleAuthSuccess(result.data);
      toast.success('注册成功', { description: '欢迎加入！' });
      router.push('/');
      return true;
    }
    const message = result.error.message || '注册失败';
    store.setError(message);
    toast.error('注册失败', { description: message });
    return false;
  }

  // ========== 验证码 ==========

  async function sendSmsCode(
    phoneNumber: string,
    purpose: SendSmsCodeReq['purpose'] = 'LOGIN',
  ): Promise<boolean> {
    const result = await service.sendSmsCode({ phoneNumber, purpose });
    if (result.ok) {
      toast.success('验证码已发送', { description: '请查收手机短信' });
      return true;
    }
    const message = result.error.message || '发送验证码失败';
    toast.error('发送失败', { description: message });
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
      toast.success('已登出');
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
