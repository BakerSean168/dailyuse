/**
 * useAuth - 核心认证 Composable
 *
 * 通过 DI 注入的 AuthClientService 与后端交互。
 * Service 负责 API 调用，Composable 负责 Store 更新 + UI 状态。
 *
 * @module authentication/presentation/composables
 */

import { computed, inject } from 'vue';
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
import { HttpClientError } from '@dailyuse/http-client';
import { useAuthenticationStore } from '../stores/authenticationStore';
import { AUTH_SERVICE_KEY, authService as fallbackService } from '@/shared/di';

export function useAuth() {
  const store = useAuthenticationStore();
  const router = useRouter();

  // 优先从 provide/inject 获取，降级使用单例
  const service = inject(AUTH_SERVICE_KEY, fallbackService);

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
      const data = await service.loginByEmail(req);
      handleAuthSuccess(data);
      toast.success('登录成功', { description: '欢迎回来！' });
      router.push('/');
      return true;
    } catch (err) {
      const message = err instanceof HttpClientError ? err.message : '登录失败';
      store.setError(message);
      toast.error('登录失败', { description: message });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  async function loginByPhone(req: LoginByPhoneReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await service.loginByPhone(req);
      handleAuthSuccess(data);
      toast.success('登录成功', { description: '欢迎回来！' });
      router.push('/');
      return true;
    } catch (err) {
      const message = err instanceof HttpClientError ? err.message : '登录失败';
      store.setError(message);
      toast.error('登录失败', { description: message });
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
      const data = await service.registerByEmail(req);
      handleAuthSuccess(data);
      toast.success('注册成功', { description: '欢迎加入！' });
      router.push('/');
      return true;
    } catch (err) {
      const message = err instanceof HttpClientError ? err.message : '注册失败';
      store.setError(message);
      toast.error('注册失败', { description: message });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  async function registerByPhone(req: RegisterByPhoneReq): Promise<boolean> {
    store.setLoading(true);
    store.setError(null);
    try {
      const data = await service.registerByPhone(req);
      handleAuthSuccess(data);
      toast.success('注册成功', { description: '欢迎加入！' });
      router.push('/');
      return true;
    } catch (err) {
      const message = err instanceof HttpClientError ? err.message : '注册失败';
      store.setError(message);
      toast.error('注册失败', { description: message });
      return false;
    } finally {
      store.setLoading(false);
    }
  }

  // ========== 验证码 ==========

  async function sendSmsCode(phoneNumber: string, purpose: SendSmsCodeReq['purpose'] = 'LOGIN'): Promise<boolean> {
    try {
      await service.sendSmsCode({ phoneNumber, purpose });
      toast.success('验证码已发送', { description: '请查收手机短信' });
      return true;
    } catch (err) {
      const message = err instanceof HttpClientError ? err.message : '发送验证码失败';
      toast.error('发送失败', { description: message });
      return false;
    }
  }

  // ========== 令牌刷新 ==========

  async function refreshToken(): Promise<boolean> {
    const currentRefreshToken = store.refreshToken;
    if (!currentRefreshToken) return false;

    try {
      const data = await service.refreshToken({ refreshToken: currentRefreshToken });
      handleAuthSuccess(data);
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // 刷新失败，清除认证状态
      store.reset();
      return false;
    }
  }

  // ========== 登出 ==========

  async function logout(): Promise<void> {
    try {
      if (store.accessToken) {
        await service.logout();
      }
    } catch (err) {
      // 登出 API 调用失败不影响客户端清理
      console.warn('Logout API call failed:', err);
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
