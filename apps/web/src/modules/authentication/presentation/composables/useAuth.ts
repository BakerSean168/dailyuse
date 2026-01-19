/**
 * Auth Composable
 * 认证组合式 API
 *
 * 职责:
 * - 调用 AuthApplicationService 获取数据
 * - 管理 Pinia Store 中的认证状态
 * - 处理登录、登出、权限检查等
 * - 为组件提供响应式的认证接口
 */

import { computed } from 'vue';
import { useAuthenticationStore } from '../stores/authenticationStore';
import type {
  LoginRequestDTO,
  ChangePasswordRequestDTO,
  AccountClientDTO,
  DeviceInfoClientDTO,
  AuthSessionClientDTO,
} from '@dailyuse/contracts/account';
import {
  Login,
  Logout,
  RefreshToken,
  ChangePassword,
  GetActiveSessions,
  RevokeSession,
} from '@dailyuse/application-client/authentication';

export function useAuth() {
  const authStore = useAuthenticationStore();

  // Use Cases from application-client
  const loginUseCase = Login.getInstance();
  const logoutUseCase = Logout.getInstance();
  const refreshTokenUseCase = RefreshToken.getInstance();
  const changePasswordUseCase = ChangePassword.getInstance();
  const getActiveSessionsUseCase = GetActiveSessions.getInstance();
  const revokeSessionUseCase = RevokeSession.getInstance();

  // ============ State (from store) ============
  const currentUser = computed(() => authStore.currentUser);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const isLoading = computed(() => authStore.isLoading);
  const error = computed(() => authStore.error);
  const isInitializing = computed(() => authStore.isInitializing);
  const requiresMFA = computed(() => authStore.requiresMFA);

  // ============ Auth Methods ============

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

      // 如果需要 MFA，设置状态但不加载用户信息
      if (response.requiresMFA) {
        authStore.setRequiresMFA(true);
        return false;
      }

      // 加载当前用户信息
      await loadCurrentUser();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      authStore.setError(errorMessage);
      console.error('❌ [useAuth] 登录失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 登出
   */
  async function logout(): Promise<void> {
    authStore.setLoading(true);
    try {
      await logoutUseCase.execute();
      authStore.reset();
      authStore.setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登出失败';
      authStore.setError(errorMessage);
      console.error('❌ [useAuth] 登出失败:', err);
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 刷新令牌
   */
  async function refreshToken(): Promise<boolean> {
    authStore.setLoading(true);
    try {
      const result = await refreshTokenUseCase.execute();
      authStore.setAccessToken(result.token || result.accessToken);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新令牌失败';
      authStore.setError(errorMessage);
      console.error('❌ [useAuth] 刷新令牌失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 获取当前用户
   */
  async function loadCurrentUser(): Promise<AccountClientDTO | null> {
    authStore.setLoading(true);
    try {
      // TODO: Need to get current user from use case
      // const user = await getCurrentUserUseCase.execute();
      // authStore.setCurrentUser(user);
      authStore.setError(null);
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取用户信息失败';
      authStore.setError(errorMessage);
      console.error('❌ [useAuth] 获取用户信息失败:', err);
      return null;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 初始化认证
   */
  async function initAuth(): Promise<boolean> {
    authStore.setIsInitializing(true);
    try {
      // TODO: Implement init auth
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化认证失败';
      authStore.setError(errorMessage);
      console.error('❌ [useAuth] 初始化认证失败:', err);
      return false;
    } finally {
      authStore.setIsInitializing(false);
    }
  }

  /**
   * 修改密码
   */
  async function changePassword(data: ChangePasswordRequestDTO): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await changePasswordUseCase.execute(data.oldPassword, data.newPassword);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '修改密码失败';
      authStore.setError(errorMessage);
      console.error('❌ [useAuth] 修改密码失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 获取 MFA 设备列表
   */
  async function loadMFADevices(): Promise<void> {
    authStore.setLoading(true);
    try {
      // TODO: Implement get MFA devices
      authStore.setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取 MFA 设备列表失败';
      authStore.setError(errorMessage);
      console.error('❌ [useAuth] 获取 MFA 设备列表失败:', err);
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 删除 MFA 设备
   */
  async function deleteMFADevice(deviceId: string): Promise<boolean> {
    authStore.setLoading(true);
    try {
      // TODO: Implement delete MFA device
      authStore.removeMFADevice(deviceId);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除 MFA 设备失败';
      authStore.setError(errorMessage);
      console.error('❌ [useAuth] 删除 MFA 设备失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 获取会话列表
   */
  async function loadSessions(): Promise<void> {
    authStore.setLoading(true);
    try {
      const sessions = await getActiveSessionsUseCase.execute();
      authStore.setActiveSessions(sessions);
      authStore.setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取会话列表失败';
      authStore.setError(errorMessage);
      console.error('❌ [useAuth] 获取会话列表失败:', err);
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 终止会话
   */
  async function terminateSession(sessionId: string): Promise<boolean> {
    authStore.setLoading(true);
    try {
      await revokeSessionUseCase.execute(sessionId);
      authStore.removeActiveSession(sessionId);
      authStore.setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '终止会话失败';
      authStore.setError(errorMessage);
      console.error('❌ [useAuth] 终止会话失败:', err);
      return false;
    } finally {
      authStore.setLoading(false);
    }
  }

  /**
   * 检查权限
   */
  function hasPermission(permission: string): boolean {
    // TODO: Implement permission check
    return true;
  }

  /**
   * 检查角色
   */
  function hasRole(role: string): boolean {
    // TODO: Implement role check
    return true;
  }

  return {
    // State
    currentUser,
    isAuthenticated,
    isLoading,
    error,
    isInitializing,
    requiresMFA,

    // Actions
    login,
    logout,
    refreshToken,
    loadCurrentUser,
    initAuth,
    changePassword,
    loadMFADevices,
    deleteMFADevice,
    loadSessions,
    terminateSession,
    hasPermission,
    hasRole,
  };
}
