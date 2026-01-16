/**
 * Login Application Service
 * 登录应用服务 - 负责登录相关的用例
 */

import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
} from '@dailyuse/contracts/authentication';
import { useAuthStore } from '../../presentation/stores/authStore';
import { authApiClient } from '../../infrastructure/api/authApiClient';
import { useAccountStore } from '../../../account/presentation/stores/accountStore';
import { accountApiClient } from '../../../account/infrastructure/api/accountApiClient';

// Type aliases
type LoginRequestDTO = LoginRequest;
type LogoutRequestDTO = LogoutRequest;
type LoginResponseDTO = LoginResponse;

export class LoginApplicationService {
  private static instance: LoginApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): LoginApplicationService {
    LoginApplicationService.instance = new LoginApplicationService();
    return LoginApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): LoginApplicationService {
    if (!LoginApplicationService.instance) {
      LoginApplicationService.instance = LoginApplicationService.createInstance();
    }
    return LoginApplicationService.instance;
  }

  /**
   * 懒加载获取 Auth Store
   */
  private get authStore(): ReturnType<typeof useAuthStore> {
    return useAuthStore();
  }

  /**
   * 懒加载获取 Account Store
   */
  private get accountStore(): ReturnType<typeof useAccountStore> {
    return useAccountStore();
  }

  // ============ 登录用例 ============

  /**
   * 用户登录
   */
  async login(request: LoginRequestDTO): Promise<LoginResponseDTO> {
    try {
      this.authStore.setLoading(true);
      this.authStore.clearError();

      const response = await authApiClient.login(request);

      // 保存tokens和会话信息
      if (response.accessToken) {
        this.authStore.setAccessToken(response.accessToken);
      }
      if (response.refreshToken) {
        this.authStore.setRefreshToken(response.refreshToken);
      }
      if (response.sessionId != null) {
        this.authStore.setCurrentSessionId(response.sessionId);
      }
      if (response.accessTokenExpiresAt != null) {
        this.authStore.setTokenExpiresAt(response.accessTokenExpiresAt);
      }

      // 🔧 修复: 登录成功后获取并设置用户信息到 AccountStore
      try {
        const account = await accountApiClient.getMyProfile();
        this.accountStore.setCurrentAccount(account);
        console.log('✅ [LoginService] 用户信息已设置到 AccountStore:', {
          accountUuid: account.uuid,
          username: account.username,
        });
      } catch (profileError) {
        console.error('❌ [LoginService] 获取用户信息失败，但登录已成功:', profileError);
        // 不抛出错误，因为登录本身是成功的
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      this.authStore.setError('Login failed');
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * 用户登出
   */
  async logout(request?: LogoutRequestDTO): Promise<void> {
    try {
      this.authStore.setLoading(true);

      await authApiClient.logout(request);

      // 清除所有认证状态
      this.authStore.clearAuth();
    } catch (error) {
      console.error('Logout failed:', error);
      // 即使登出失败也清除本地状态
      this.authStore.clearAuth();
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(): Promise<void> {
    try {
      const refreshToken = this.authStore.refreshToken;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authApiClient.refreshToken({ refreshToken });

      // 更新tokens
      this.authStore.setAccessToken(response.accessToken);
      if (response.refreshToken) {
        this.authStore.setRefreshToken(response.refreshToken);
      }
      this.authStore.setTokenExpiresAt(response.accessTokenExpiresAt);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      // Token刷新失败，清除认证状态
      this.authStore.clearAuth();
      throw error;
    }
  }

  /**
   * 检查token是否即将过期（10分钟内过期则刷新）
   */
  async checkAndRefreshToken(): Promise<void> {
    const expiresAt = this.authStore.tokenExpiresAt;
    if (!expiresAt) return;

    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    // 如果token将在10分钟内过期，则刷新
    if (expiresAt - now < tenMinutes) {
      await this.refreshAccessToken();
    }
  }
}

// 导出单例
export const loginApplicationService = LoginApplicationService.getInstance();

