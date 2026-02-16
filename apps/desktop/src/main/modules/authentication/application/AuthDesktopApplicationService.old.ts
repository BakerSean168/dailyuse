/**
 * Auth Desktop Application Service
 *
 * 使用 DDD 最佳实践的 Authentication 应用服务：
 * 1. 作为 Use Cases 的 thin wrapper
 * 2. 清晰的职责分离
 * 3. Desktop 特有逻辑（离线模式）与在线功能分离
 * 4. 统一的类型定义
 *
 * 架构原则：
 * - Application Service 只负责编排，不包含业务逻辑
 * - 所有业务逻辑在 Use Cases (@dailyuse/application-server) 中
 * - Desktop 离线模式不支持大部分认证功能
 */

// Note: Authentication Use Cases are commented out for future online mode
// import {
//   Login,
//   Logout,
//   RefreshToken,
//   ChangePassword,
//   Enable2FA,
//   Verify2FA,
//   Disable2FA,
//   GetActiveSessions,
//   RevokeSession,
//   RevokeAllSessions,
//   CreateApiKey,
//   ListApiKeys,
//   RevokeApiKey,
// } from '@dailyuse/authentication/application-server';

import { createLogger, type ILogger } from '@dailyuse/utils';

// ===== Types =====

/**
 * 通用操作结果
 */
export interface AuthOperationResult {
  success: boolean;
  error?: string;
}

/**
 * 登录凭据
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

/**
 * 认证状态
 */
export interface AuthStatus {
  authenticated: boolean;
  user: null;
}

/**
 * 2FA 状态
 */
export interface TwoFactorStatus {
  enabled: boolean;
  method: string | null;
}

/**
 * API Key 信息
 */
export interface ApiKeyInfo {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * Session 信息
 */
export interface SessionInfo {
  id: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
}

/**
 * Device 信息
 */
export interface DeviceInfo {
  id: string;
  name: string;
  type: string;
}

/**
 * 当前 Desktop 设备
 */
const CURRENT_DESKTOP_DEVICE: DeviceInfo = {
  id: 'desktop-local',
  name: 'Desktop App',
  type: 'desktop',
};

// ===== Application Service =====

/**
 * Auth Desktop Application Service
 *
 * 为 Desktop IPC handlers 提供统一的认证应用服务入口
 * Desktop 版本主要使用离线模式，大部分认证功能返回占位符
 */
export class AuthDesktopApplicationService {
  private readonly logger: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger || createLogger('AuthDesktopAppService');
  }

  // ============================================
  // Core Auth (Mostly Offline Placeholders)
  // ============================================

  /**
   * 登录
   * @description Desktop 离线模式不支持登录
   */
  async login(credentials: LoginCredentials): Promise<AuthOperationResult> {
    this.logger.debug('Login attempt', { email: credentials.email });

    // TODO: 实现在线模式
    // try {
    //   const result = await login({
    //     identifier: credentials.email,
    //     password: credentials.password,
    //     deviceInfo: { type: 'desktop', name: 'Desktop App' },
    //   });
    //   return { success: true };
    // } catch (error) {
    //   return { success: false, error: error.message };
    // }

    return {
      success: false,
      error: 'Desktop offline mode - login not supported',
    };
  }

  /**
   * 注册
   * @description Desktop 离线模式不支持注册
   */
  async register(request: RegisterRequest): Promise<AuthOperationResult> {
    this.logger.debug('Register attempt', { email: request.email });
    return {
      success: false,
      error: 'Desktop offline mode - registration not supported',
    };
  }

  /**
   * 登出
   * @description Desktop 总是返回成功（无会话需要清理）
   */
  async logout(): Promise<AuthOperationResult> {
    this.logger.debug('Logout');
    return { success: true };
  }

  /**
   * 刷新令牌
   * @description Desktop 离线模式无令牌
   */
  async refreshToken(): Promise<AuthOperationResult> {
    this.logger.debug('Refresh token');
    return { success: false, error: 'No token to refresh in offline mode' };
  }

  /**
   * 验证令牌
   * @description Desktop 离线模式无令牌
   */
  async verifyToken(_token: string): Promise<{ valid: boolean }> {
    this.logger.debug('Verify token');
    return { valid: false };
  }

  /**
   * 获取认证状态
   * @description Desktop 离线模式总是未认证
   */
  async getStatus(): Promise<AuthStatus> {
    this.logger.debug('Get auth status');
    return { authenticated: false, user: null };
  }

  // ============================================
  // 2FA (Offline Placeholders)
  // ============================================

  /**
   * 启用双因素认证
   * @description 仅在线模式可用
   */
  async enable2FA(_method: string): Promise<AuthOperationResult> {
    this.logger.debug('Enable 2FA');
    return { success: false, error: 'Desktop offline mode - 2FA not available' };
  }

  /**
   * 禁用双因素认证
   * @description 仅在线模式可用
   */
  async disable2FA(): Promise<AuthOperationResult> {
    this.logger.debug('Disable 2FA');
    return { success: false, error: 'Desktop offline mode - 2FA not available' };
  }

  /**
   * 验证双因素认证
   * @description 仅在线模式可用
   */
  async verify2FA(_code: string): Promise<AuthOperationResult> {
    this.logger.debug('Verify 2FA');
    return { success: false, error: 'Desktop offline mode - 2FA not available' };
  }

  /**
   * 获取 2FA 状态
   * @description Desktop 离线模式 2FA 未启用
   */
  async get2FAStatus(): Promise<TwoFactorStatus> {
    this.logger.debug('Get 2FA status');
    return { enabled: false, method: null };
  }

  /**
   * 生成备份码
   * @description 仅在线模式可用
   */
  async generateBackupCodes(): Promise<{ codes: string[] }> {
    this.logger.debug('Generate backup codes');
    return { codes: [] };
  }

  // ============================================
  // API Keys (Offline Placeholders)
  // ============================================

  /**
   * 创建 API Key
   * @description 仅在线模式可用
   */
  async createApiKey(request: { name: string; scopes?: string[] }): Promise<{ id: string; key: string } | null> {
    this.logger.debug('Create API key', { name: request.name });
    return null;
  }

  /**
   * 列出 API Keys
   * @description 仅在线模式可用
   */
  async listApiKeys(): Promise<{ apiKeys: ApiKeyInfo[]; total: number }> {
    this.logger.debug('List API keys');
    return { apiKeys: [], total: 0 };
  }

  /**
   * 撤销 API Key
   * @description 仅在线模式可用
   */
  async revokeApiKey(_keyId: string): Promise<AuthOperationResult> {
    this.logger.debug('Revoke API key');
    return { success: false, error: 'Desktop offline mode - API keys not available' };
  }

  /**
   * 轮换 API Key
   * @description 仅在线模式可用
   */
  async rotateApiKey(_keyId: string): Promise<{ newKey: string | null }> {
    this.logger.debug('Rotate API key');
    return { newKey: null };
  }

  // ============================================
  // Sessions (Offline Placeholders)
  // ============================================

  /**
   * 列出会话
   * @description Desktop 离线模式无远程会话
   */
  async listSessions(): Promise<{ sessions: SessionInfo[]; total: number }> {
    this.logger.debug('List sessions');
    return { sessions: [], total: 0 };
  }

  /**
   * 获取当前会话
   * @description Desktop 离线模式无会话
   */
  async getCurrentSession(): Promise<SessionInfo | null> {
    this.logger.debug('Get current session');
    return null;
  }

  /**
   * 撤销会话
   * @description 仅在线模式可用
   */
  async revokeSession(_sessionId: string): Promise<AuthOperationResult> {
    this.logger.debug('Revoke session');
    return { success: false, error: 'Desktop offline mode - sessions not available' };
  }

  /**
   * 撤销所有会话
   * @description 仅在线模式可用
   */
  async revokeAllSessions(): Promise<{ success: boolean; count: number }> {
    this.logger.debug('Revoke all sessions');
    return { success: true, count: 0 };
  }

  // ============================================
  // Devices
  // ============================================

  /**
   * 列出设备
   * @description Desktop 离线模式只显示本地设备
   */
  async listDevices(): Promise<{ devices: DeviceInfo[]; total: number }> {
    this.logger.debug('List devices');
    return { devices: [CURRENT_DESKTOP_DEVICE], total: 1 };
  }

  /**
   * 获取当前设备
   * @description 返回本地 Desktop 设备信息
   */
  async getCurrentDevice(): Promise<DeviceInfo> {
    this.logger.debug('Get current device');
    return CURRENT_DESKTOP_DEVICE;
  }

  /**
   * 撤销设备
   * @description 仅在线模式可用（不能撤销本地设备）
   */
  async revokeDevice(deviceId: string): Promise<AuthOperationResult> {
    this.logger.debug('Revoke device', { deviceId });
    if (deviceId === CURRENT_DESKTOP_DEVICE.id) {
      return { success: false, error: 'Cannot revoke current device' };
    }
    return { success: false, error: 'Desktop offline mode - device management not available' };
  }

  /**
   * 重命名设备
   * @description 仅支持本地设备重命名
   */
  async renameDevice(deviceId: string, name: string): Promise<AuthOperationResult> {
    this.logger.debug('Rename device', { deviceId, name });
    if (deviceId === CURRENT_DESKTOP_DEVICE.id) {
      // TODO: 持久化设备名称到本地设置
      return { success: true };
    }
    return { success: false, error: 'Desktop offline mode - device management not available' };
  }
}

// ===== Factory Function =====

/**
 * 创建 AuthDesktopApplicationService 实例
 */
export function createAuthDesktopApplicationService(
  logger?: ILogger,
): AuthDesktopApplicationService {
  return new AuthDesktopApplicationService(logger);
}
