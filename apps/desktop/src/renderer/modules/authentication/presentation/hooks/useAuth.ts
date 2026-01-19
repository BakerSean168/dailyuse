/**
 * useAuth Hook
 *
 * 认证管理 Hook - 渲染进程
 *
 * 职责：
 * - 封装认证状态管理
 * - 调用 AuthApplicationService 执行认证逻辑
 * - 提供响应式状态给组件
 *
 * 架构：Presentation Layer → Application Layer → Use Cases
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticationApplicationService } from '@dailyuse/application-client/authentication';
import type { LoginRequest, RegisterRequest } from '@dailyuse/contracts/authentication';

// ===== Types =====

export interface AuthUser {
  uuid: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  checkAuth: () => boolean;
  clearError: () => void;
}

// ===== Hook Implementation =====

export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();

  const [state, setState] = useState<AuthState>({
    isAuthenticated: authenticationApplicationService.isTokenValid(),
    user: authenticationApplicationService.getStoredUser<AuthUser>(),
    loading: false,
    error: null,
  });

  // ===== Actions =====

  /**
   * 检查认证状态
   */
  const checkAuth = useCallback(() => {
    const valid = authenticationApplicationService.isTokenValid();
    const user = authenticationApplicationService.getStoredUser<AuthUser>();
    setState((prev) => ({
      ...prev,
      isAuthenticated: valid,
      user: valid ? user : null,
    }));
    return valid;
  }, []);

  /**
   * 登录
   */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await authenticationApplicationService.login(credentials);

        // 构建用户信息
        const user: AuthUser = {
          uuid: response.sessionId || '',
          email: credentials.identifier,
        };

        // 保存用户信息
        authenticationApplicationService.saveUser(user);

        setState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        });

        navigate('/dashboard');
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '登录失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [navigate],
  );

  /**
   * 注册
   */
  const register = useCallback(
    async (request: RegisterRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await authenticationApplicationService.register(request);
        setState((prev) => ({ ...prev, loading: false }));
        navigate('/login');
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '注册失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [navigate],
  );

  /**
   * 登出
   */
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    await authenticationApplicationService.logout();

    setState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });

    navigate('/login');
  }, [navigate]);

  /**
   * 忘记密码
   */
  const forgotPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await authenticationApplicationService.forgotPassword(email);
      setState((prev) => ({ ...prev, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '发送重置邮件失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw e;
    }
  }, []);

  /**
   * 重置密码
   */
  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await authenticationApplicationService.resetPassword({
          token,
          newPassword,
          confirmPassword: newPassword,
        });
        setState((prev) => ({ ...prev, loading: false }));
        navigate('/login');
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : '重置密码失败';
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw e;
      }
    },
    [navigate],
  );

  /**
   * 修改密码
   */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      await authenticationApplicationService.changePassword({
        oldPassword: currentPassword,
        newPassword,
        confirmPassword: newPassword,
      });
      setState((prev) => ({ ...prev, loading: false }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '修改密码失败';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw e;
    }
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ===== Effects =====

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ===== Return =====

  return {
    // State
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    loading: state.loading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    checkAuth,
    clearError,
  };
}

export default useAuth;
