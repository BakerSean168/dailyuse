/**
 * Auth Application Service - Renderer
 *
 * 认证应用服务 - 渲染进程
 *
 * 职责�?
 * - 调用 @dailyuse/application-client �?Auth Use Cases
 * - 管理 Token 存储
 * - 不包含业务逻辑
 */

import {
  // Use Case Services
  Login,
  Logout,
  Register,
  ForgotPassword,
  ResetPassword,
  ChangePassword,
  RefreshToken,
} from '@dailyuse/application-client';
import type {
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  LoginResponse,
  RefreshTokenResponse,
} from '@dailyuse/contracts/authentication';
import type { RegisterResponse } from '@dailyuse/infrastructure-client';

// ===== Local Storage Keys =====

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'dailyuse_access_token',
  REFRESH_TOKEN: 'dailyuse_refresh_token',
  TOKEN_EXPIRES_AT: 'dailyuse_token_expires_at',
  USER: 'dailyuse_user',
} as const;

/**
 * Auth Application Service
 *
 * 渲染进程认证应用服务
 */
export class AuthApplicationService {
  private static instance: AuthApplicationService;

  private constructor() {}

  static getInstance(): AuthApplicationService {
    if (!AuthApplicationService.instance) {
      AuthApplicationService.instance = new AuthApplicationService();
    }
    return AuthApplicationService.instance;
  }

  // ===== Authentication =====

  /**
   * 登录
   */
  async login(input: LoginRequest): Promise<LoginResponse> {
    const response = await Login.getInstance().execute(input);
    this.saveTokens(response);
    return response;
  }

  /**
   * 注册
   */
  async register(input: RegisterRequest): Promise<RegisterResponse> {
    return Register.getInstance().execute(input);
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await Logout.getInstance().execute({});
    } catch (e) {
      console.warn('[AuthService] Logout API call failed:', e);
    } finally {
      this.clearTokens();
    }
  }

  // ===== Password =====

  /**
   * 忘记密码
   */
  async forgotPassword(email: string): Promise<void> {
    await ForgotPassword.getInstance().execute({ email });
  }

  /**
   * 重置密码
   */
  async resetPassword(input: ResetPasswordRequest): Promise<void> {
    await ResetPassword.getInstance().execute(input);
  }

  /**
   * 修改密码
   */
  async changePassword(input: ChangePasswordRequest): Promise<void> {
    await ChangePassword.getInstance().execute(input);
  }

  // ===== Token Management =====

  /**
   * 刷新 Token
   */
  async refreshAccessToken(): Promise<RefreshTokenResponse | null> {
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!storedRefreshToken) {
      return null;
    }

    try {
      const response = await RefreshToken.getInstance().execute({ refreshToken: storedRefreshToken });
      this.saveTokens(response as LoginResponse);
      return response;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  /**
   * 检�?Token 是否有效
   */
  isTokenValid(): boolean {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const expiresAt = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!token || !expiresAt) return false;
    return Date.now() < parseInt(expiresAt, 10);
  }

  /**
   * 获取存储的用户信�?
   */
  getStoredUser<T>(): T | null {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * 保存用户信息
   */
  saveUser(user: unknown): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  // ===== Private Methods =====

  private saveTokens(response: LoginResponse): void {
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

  private clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

// 导出单例实例
export const authApplicationService = AuthApplicationService.getInstance();

