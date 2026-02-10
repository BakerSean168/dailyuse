/**
 * Login Composable
 * 登录组合式 API
 *
 * 职责:
 * - 调用 LoginApplicationService 获取数据
 * - 管理登录相关的状态
 * - 处理令牌管理和访问令牌刷新
 */

import { computed } from 'vue';
import { useAuthenticationStore } from '../stores/authenticationStore';
import type { LoginRequestDTO } from '@dailyuse/contracts/account';
import { Login, Logout, RefreshToken } from '@dailyuse/authentication/application-client';

export function useLogin() {
  const authStore = useAuthenticationStore();

  // Use Cases from application-client
  const loginUseCase = Login.getInstance();
  const logoutUseCase = Logout.getInstance();
  const refreshTokenUseCase = RefreshToken.getInstance();

  // ============ State (from store) ============
  const isLoading = computed(() => authStore.isLoading);
  const error = computed(() => authStore.error);
  const isAuthenticated = computed(() => authStore.isAuthenticated);

  // ============ Login Methods ============

  /**
   * 登录
   */
  async function login(request: LoginRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      const response = await loginUseCase.execute(request);
      authStore.setAccessToken(response.accessToken || response.token, response.expiresIn);
      authStore.setRefreshToken(response.refreshToken);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      authStore.setError(errorMessage);
      console.error('❌ [useLogin] 登录失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 登出
   */
  async function logout(): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await logoutUseCase.execute();
      authStore.clearTokens();
      authStore.clearCurrentUser();
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登出失败';
      authStore.setError(errorMessage);
      console.error('❌ [useLogin] 登出失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 刷新访问令牌
   */
  async function refreshAccessToken(): Promise<boolean> {
    authStore.setLoading(true);
    try {
      const result = await refreshTokenUseCase.execute();
      authStore.setAccessToken(result.token || result.accessToken);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新令牌失败';
      authStore.setError(errorMessage);
      console.error('❌ [useLogin] 刷新令牌失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 检查并刷新令牌（如果需要）
   */
  async function checkAndRefreshToken(): Promise<boolean> {
    try {
      // Check if token is expiring soon and refresh if needed
      const accessToken = authStore.getAccessToken();
      if (accessToken) {
        // TODO: Implement token expiry check
        await refreshAccessToken();
      }
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查/刷新令牌失败';
      authStore.setError(errorMessage);
      console.error('❌ [useLogin] 检查/刷新令牌失败:', err);
      return false;
    }
  }

  return {
    // State
    isLoading,
    error,
    isAuthenticated,

    // Actions
    login,
    logout,
    refreshAccessToken,
    checkAndRefreshToken,
  };
}
