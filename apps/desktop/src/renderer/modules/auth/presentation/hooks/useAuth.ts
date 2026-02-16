/**
 * useAuth Hook
 *
 * 认证逻辑钩子 - 管理登录状态、Token 和用户信�?
 * Story-008: Auth & Account UI
 * 
 * 使用 @dailyuse/application-client �?Use Case 实现 DDD 架构
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Login,
  Register,
  Logout,
  ForgotPassword,
  ResetPassword,
  ChangePassword,
} from '@dailyuse/authentication/application-server';
import type { LoginRequest, RegisterRequest, LoginResponse } from '@dailyuse/contracts/authentication';

// ============ Types ============

export interface AuthUser {
  id: string;
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

// ============ Local Storage Keys ============

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'dailyuse_access_token',
  REFRESH_TOKEN: 'dailyuse_refresh_token',
  TOKEN_EXPIRES_AT: 'dailyuse_token_expires_at',
  USER: 'dailyuse_user',
} as const;

// ============ Token Storage Helpers ============

function saveTokens(response: LoginResponse) {
  if (response.accessToken) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
  }
  if (response.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
  }
  localStorage.setItem(
    STORAGE_KEYS.TOKEN_EXPIRES_AT,
    String(response.accessTokenExpiresAt || Date.now() + 3600000),
  );
}

function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

function getStoredUser(): AuthUser | null {
  const userJson = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

function isTokenValid(): boolean {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  if (!token || !expiresAt) return false;
  return Date.now() < parseInt(expiresAt, 10);
}

// ============ Hook ============

export function useAuth() {
  const navigate = useNavigate();

  // State
  const [state, setState] = useState<AuthState>({
    isAuthenticated: isTokenValid(),
    user: getStoredUser(),
    loading: false,
    error: null,
  });

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication status
  const checkAuth = useCallback(() => {
    const valid = isTokenValid();
    const user = getStoredUser();
    setState((prev) => ({
      ...prev,
      isAuthenticated: valid,
      user: valid ? user : null,
    }));
    return valid;
  }, []);

  // Login
  const login = useCallback(
    async (credentials: LoginRequest) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 使用 application-client Use Case
        const response = await Login.getInstance().execute(credentials);

        // Save tokens
        saveTokens(response);

        // Update state - LoginResponse 不包含用户信�?
        // 用户信息需要从另一�?API 获取（如 AccountContainer�?
        const user: AuthUser = {
          id: response.sessionId || '',
          email: credentials.identifier,
          username: undefined,
          displayName: undefined,
          avatarUrl: undefined,
        };

        // 保存用户信息�?localStorage
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        setState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        });

        // Navigate to dashboard
        navigate('/dashboard');

        return response;
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

  // Register
  const register = useCallback(
    async (request: {
      email: string;
      password: string;
      username?: string;
      displayName?: string;
    }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 使用 application-client Use Case
        const response = await Register.getInstance().execute({
          email: request.email,
          password: request.password,
          username: request.username || request.email.split('@')[0],
          confirmPassword: request.password,
        });

        setState((prev) => ({ ...prev, loading: false }));

        // Navigate to login after successful registration
        navigate('/login');

        return response;
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

  // Logout
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      // 使用 application-client Use Case
      await Logout.getInstance().execute({});
    } catch (e) {
      console.warn('[useAuth] Logout API call failed:', e);
    } finally {
      // Always clear local state
      clearTokens();
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      navigate('/login');
    }
  }, [navigate]);

  // Forgot Password
  const forgotPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 使用 application-client Use Case
      await ForgotPassword.getInstance().execute({ email });
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

  // Reset Password
  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 使用 application-client Use Case
        await ResetPassword.getInstance().execute({ token, newPassword, confirmPassword: newPassword });
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

  // Change Password
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // 使用 application-client Use Case
        await ChangePassword.getInstance().execute({ oldPassword: currentPassword, newPassword, confirmPassword: newPassword });
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
    },
    [],
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

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

