/**
 * Auth Application Service - Framework Agnostic
 * 认证应用服务 - 框架无关版本
 *
 * 使用依赖注入模式管理状态，可在任何环境中使用
 */

import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
} from '@dailyuse/contracts/authentication';
import type { AccountClientDTO } from '@dailyuse/contracts/account';

export type LoginRequestDTO = LoginRequest;
export type ChangePasswordRequestDTO = ChangePasswordRequest;
export type LoginResponseDTO = LoginResponse;

/**
 * State manager interface for authentication
 * Allows this service to work with any state management solution
 */
export interface IStateManager {
  setLoading(value: boolean): void;
  setError(error: string | null): void;
  setUser(user: AccountClientDTO): void;
  setTokens(tokens: any): void;
  setAccessToken(token: string): void;
  setRefreshToken(token: string): void;
  setMFADevices(devices: any[]): void;
  removeMFADevice(deviceId: string): void;
  setCurrentSession(session: any): void;
  logout(): void;
  hasPermission(permission: string): boolean;
  hasRole(role: string): boolean;
  readonly getCurrentUser: AccountClientDTO | null;
  readonly getRefreshToken: string | null;
}

/**
 * API client interface
 */
export interface IAuthApiClient {
  login(request: LoginRequestDTO): Promise<LoginResponseDTO>;
  logout(): Promise<void>;
  refreshToken(data: any): Promise<any>;
  getCurrentUser(): Promise<AccountClientDTO>;
  changePassword(data: ChangePasswordRequestDTO): Promise<void>;
  getMFADevices(): Promise<any>;
  deleteMFADevice(deviceId: string): Promise<void>;
  getSessions(): Promise<any>;
  terminateSession(sessionId: string): Promise<void>;
}

/**
 * Event publisher interface
 */
export interface IEventPublisher {
  publishUserLoggedIn(payload: any): void;
  publishUserLoggedOut(payload: any): void;
}

/**
 * Auth Application Service
 * 协调 API 调用和状态管理，实现核心认证用例
 */
export class AuthApplicationService {
  constructor(
    private stateManager: IStateManager,
    private apiClient: IAuthApiClient,
    private eventPublisher?: IEventPublisher,
  ) {}

  /**
   * 用户登录
   */
  async login(request: LoginRequestDTO): Promise<LoginResponseDTO> {
    try {
      this.stateManager.setLoading(true);
      this.stateManager.setError(null);

      const response = await this.apiClient.login(request);
      const { user, accessToken, refreshToken, expiresIn } = response;

      // Update state
      this.stateManager.setUser(user);
      this.stateManager.setTokens({ accessToken, refreshToken, expiresIn });

      // Publish event if publisher available
      if (this.eventPublisher) {
        this.eventPublisher.publishUserLoggedIn({
          accountUuid: user.uuid,
          username: user.username,
          accessToken,
          refreshToken,
          expiresIn,
          loginTime: new Date(),
        });
      }

      console.log('✅ 登录成功');
      return response;
    } catch (error) {
      const msg = error instanceof Error ? error.message : '登录失败';
      this.stateManager.setError(msg);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    const currentUser = this.stateManager.getCurrentUser;

    try {
      this.stateManager.setLoading(true);
      await this.apiClient.logout();

      if (this.eventPublisher) {
        this.eventPublisher.publishUserLoggedOut({
          accountUuid: currentUser?.uuid,
          username: currentUser?.username,
          reason: 'manual',
          logoutTime: new Date(),
        });
      }
    } catch (err) {
      console.warn('登出 API 调用失败:', err);
    } finally {
      this.stateManager.logout();
      this.stateManager.setLoading(false);
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<void> {
    const refreshToken = this.stateManager.getRefreshToken;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      this.stateManager.setLoading(true);
      const data = await this.apiClient.refreshToken({ refreshToken });

      this.stateManager.setAccessToken(data.accessToken);
      if (data.refreshToken) {
        this.stateManager.setRefreshToken(data.refreshToken);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '刷新令牌失败';
      this.stateManager.setError(msg);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<AccountClientDTO> {
    try {
      this.stateManager.setLoading(true);
      const user = await this.apiClient.getCurrentUser();
      this.stateManager.setUser(user);
      return user;
    } catch (error) {
      const msg = error instanceof Error ? error.message : '获取用户信息失败';
      this.stateManager.setError(msg);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * 初始化认证
   */
  async initAuth(): Promise<AccountClientDTO | null> {
    try {
      return await this.getCurrentUser();
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  /**
   * 修改密码
   */
  async changePassword(data: ChangePasswordRequestDTO): Promise<void> {
    try {
      this.stateManager.setLoading(true);
      await this.apiClient.changePassword(data);
      console.log('✅ 密码修改成功');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '修改密码失败';
      this.stateManager.setError(msg);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * 获取 MFA 设备
   */
  async getMFADevices(): Promise<any[]> {
    try {
      this.stateManager.setLoading(true);
      const data = await this.apiClient.getMFADevices();
      this.stateManager.setMFADevices(data.devices || data);
      return data.devices || data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : '获取 MFA 设备失败';
      this.stateManager.setError(msg);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * 删除 MFA 设备
   */
  async deleteMFADevice(deviceId: string): Promise<void> {
    try {
      this.stateManager.setLoading(true);
      await this.apiClient.deleteMFADevice(deviceId);
      this.stateManager.removeMFADevice(deviceId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '删除 MFA 设备失败';
      this.stateManager.setError(msg);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * 获取会话列表
   */
  async getSessions(): Promise<any[]> {
    try {
      this.stateManager.setLoading(true);
      const data = await this.apiClient.getSessions();
      return data.sessions || data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : '获取会话列表失败';
      this.stateManager.setError(msg);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * 终止会话
   */
  async terminateSession(sessionId: string): Promise<void> {
    try {
      this.stateManager.setLoading(true);
      await this.apiClient.terminateSession(sessionId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '终止会话失败';
      this.stateManager.setError(msg);
      throw error;
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * 检查权限
   */
  hasPermission(permission: string): boolean {
    return this.stateManager.hasPermission(permission);
  }

  /**
   * 检查角色
   */
  hasRole(role: string): boolean {
    return this.stateManager.hasRole(role);
  }
}
