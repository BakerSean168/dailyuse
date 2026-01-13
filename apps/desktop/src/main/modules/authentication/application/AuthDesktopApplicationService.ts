/**
 * Auth Desktop Application Service
 *
 * 使用 DDD 最佳实践的 Authentication 应用服务：
 * 1. 整合 TokenManager 和 SessionManager
 * 2. 支持离线模式和在线模式
 * 3. Steam-like 认证流程（离线优先 + 可选云端同步）
 * 4. 统一的类型定义
 *
 * 架构原则：
 * - Application Service 只负责编排，不包含业务逻辑
 * - TokenManager 负责 Token 加密存储
 * - SessionManager 负责会话生命周期管理
 * - Desktop 支持离线模式和在线模式切换
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import type { IAuthSessionRepository, IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import type { AuthSession } from '@dailyuse/domain-server/authentication';
import type {
  AuthMode,
  TokenStatus,
  AuthOperationResult,
  AutoLoginResult as ContractAutoLoginResult,
  SessionRestoreResult as ContractSessionRestoreResult,
} from '@dailyuse/contracts/authentication';
import {
  TokenManager,
  getTokenManager,
  SessionManager,
  createSessionManager,
  type SessionStatus,
  type LoginRequest as SessionLoginRequest,
  type LoginResponse as SessionLoginResponse,
} from '../infrastructure';

// Re-export from contracts for convenience
export type { AuthOperationResult };

// ===== Types =====

/**
 * 登录凭据
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
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
 * 用户信息
 */
export interface UserInfo {
  uuid: string;
  username?: string;
  email?: string;
  displayName?: string;
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
  uuid: string;
  name: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * Session 信息
 */
export interface SessionInfo {
  uuid: string;
  deviceName: string;
  deviceType: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrentSession: boolean;
}

/**
 * Device 信息
 */
export interface DeviceInfo {
  uuid: string;
  name: string;
  type: string;
  os?: string;
  fingerprint?: string;
}

/**
 * 认证状态
 */
export interface AuthStatus {
  /** 是否已认证 */
  authenticated: boolean;
  /** 认证模式 */
  mode: AuthMode;
  /** 用户信息 */
  user: UserInfo | null;
  /** 会话信息 */
  session: SessionInfo | null;
  /** Token 状态 */
  tokenStatus: TokenStatus | null;
}

/**
 * 自动登录结果（扩展 Contract 类型）
 */
export interface AutoLoginResult extends ContractAutoLoginResult {
  session?: AuthSession;
}

/**
 * 会话恢复结果
 */
export interface SessionRestoreResult extends ContractSessionRestoreResult {
  hasValidSession: boolean;
  session?: AuthSession;
}

// ===== Application Service =====

/**
 * Auth Desktop Application Service
 *
 * 为 Desktop IPC handlers 提供统一的认证应用服务入口
 * 支持离线模式和在线模式切换
 */
export class AuthDesktopApplicationService {
  private readonly logger: ILogger;
  private readonly tokenManager: TokenManager;
  private sessionManager: SessionManager | null = null;

  // 依赖注入的 Repositories（惰性初始化）
  private sessionRepository: IAuthSessionRepository | null = null;
  private credentialRepository: IAuthCredentialRepository | null = null;

  // 当前认证模式
  private authMode: 'ONLINE' | 'OFFLINE' | 'LOCAL' = 'LOCAL';
  private isInitialized = false;

  constructor(logger?: ILogger) {
    this.logger = logger || createLogger('AuthDesktopAppService');
    this.tokenManager = getTokenManager(this.logger);
  }

  /**
   * 设置 Repositories（延迟注入）
   */
  setRepositories(
    sessionRepository: IAuthSessionRepository,
    credentialRepository: IAuthCredentialRepository,
  ): void {
    this.sessionRepository = sessionRepository;
    this.credentialRepository = credentialRepository;

    // 创建 SessionManager
    this.sessionManager = createSessionManager(
      sessionRepository,
      credentialRepository,
      this.logger,
    );

    this.logger.info('Repositories injected');
  }

  /**
   * 初始化认证服务
   *
   * 应在应用启动时调用，执行：
   * 1. 初始化 SessionManager
   * 2. 尝试恢复上次会话
   * 3. 启动自动刷新
   */
  async initialize(): Promise<SessionRestoreResult> {
    if (this.isInitialized) {
      this.logger.warn('AuthDesktopApplicationService already initialized');
      return {
        success: true,
        hasValidSession: this.sessionManager?.getCurrentSession()?.isValid() ?? false,
      };
    }

    this.logger.info('Initializing AuthDesktopApplicationService');

    if (!this.sessionManager) {
      this.logger.warn('SessionManager not available, running in minimal mode');
      this.isInitialized = true;
      return { success: true, hasValidSession: false };
    }

    try {
      const result = await this.sessionManager.initialize();

      this.isInitialized = true;
      this.logger.info('AuthDesktopApplicationService initialized', {
        hasSession: result.success,
        accountUuid: result.accountUuid,
      });

      return {
        success: true,
        hasValidSession: result.success,
        accountUuid: result.accountUuid,
        sessionUuid: result.session?.uuid,
        needsRefresh: result.needsRefresh,
        needsReLogin: result.needsReLogin,
      };
    } catch (error) {
      this.logger.error('Failed to initialize', { error });
      this.isInitialized = true;
      return {
        success: false,
        hasValidSession: false,
        error: String(error),
        needsReLogin: true,
      };
    }
  }

  // ============================================
  // Core Auth Methods
  // ============================================

  /**
   * 登录
   */
  async login(credentials: LoginCredentials): Promise<AuthOperationResult> {
    this.logger.info('Login attempt', { email: credentials.email });

    if (!this.sessionManager) {
      return { success: false, error: 'Authentication service not initialized' };
    }

    try {
      const result = await this.sessionManager.login({
        identifier: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe,
      });

      if (result.success) {
        this.authMode = 'LOCAL'; // 或根据实际情况设置为 ONLINE
        this.logger.info('Login successful', { accountUuid: result.accountUuid });
      }

      return {
        success: result.success,
        error: result.error,
        data: result.success ? {
          accountUuid: result.accountUuid,
          sessionUuid: result.sessionId,
        } : undefined,
      };
    } catch (error) {
      this.logger.error('Login failed', { error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * 注册
   * @description 在线模式注册新账户
   */
  async register(request: RegisterRequest): Promise<AuthOperationResult> {
    this.logger.info('Register attempt', { email: request.email });

    // TODO: 实现在线注册
    // 目前返回离线模式提示
    if (this.authMode === 'LOCAL') {
      return {
        success: false,
        error: 'Online registration not available in local mode. Please connect to the server first.',
      };
    }

    return {
      success: false,
      error: 'Registration not implemented yet',
    };
  }

  /**
   * 登出
   */
  async logout(): Promise<AuthOperationResult> {
    this.logger.info('Logout');

    if (!this.sessionManager) {
      // 至少清除 Token
      await this.tokenManager.clearTokens();
      return { success: true };
    }

    try {
      const result = await this.sessionManager.logout();
      this.authMode = 'LOCAL';
      return result;
    } catch (error) {
      this.logger.error('Logout failed', { error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * 自动登录
   *
   * 使用存储的 Token 自动恢复会话
   */
  async autoLogin(): Promise<AutoLoginResult> {
    this.logger.info('Auto login attempt');

    if (!this.sessionManager) {
      return { success: false, authenticated: false, error: 'Service not initialized' };
    }

    try {
      const result = await this.sessionManager.autoLogin();

      return {
        success: result.success,
        authenticated: result.success,
        accountUuid: result.accountUuid,
        sessionUuid: result.session?.uuid,
        error: result.error,
      };
    } catch (error) {
      this.logger.error('Auto login failed', { error });
      return { success: false, authenticated: false, error: String(error) };
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<AuthOperationResult> {
    this.logger.info('Refresh token');

    if (!this.sessionManager) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const result = await this.sessionManager.refreshSession();
      return {
        success: result.success,
        error: result.error,
        data: result.success ? {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        } : undefined,
      };
    } catch (error) {
      this.logger.error('Refresh token failed', { error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * 验证令牌
   */
  async verifyToken(token: string): Promise<{ valid: boolean; error?: string }> {
    this.logger.debug('Verify token');

    try {
      const currentToken = await this.tokenManager.getAccessToken();
      if (!currentToken) {
        return { valid: false, error: 'No token available' };
      }

      // 简单比较（实际应该验证 JWT）
      return { valid: token === currentToken };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  /**
   * 获取认证状态
   */
  async getStatus(): Promise<AuthStatus> {
    this.logger.debug('Get auth status');

    const tokenStatus = await this.tokenManager.getStatus();
    const session = this.sessionManager?.getCurrentSession();

    const authenticated = session?.isValid() ?? false;
    const user: UserInfo | null = session ? {
      uuid: session.accountUuid,
    } : null;

    const sessionInfo: SessionInfo | null = session ? {
      uuid: session.uuid,
      deviceName: (session.device as any)?.deviceId ?? 'Unknown',
      deviceType: (session.device as any)?.deviceType ?? 'DESKTOP',
      ipAddress: session.ipAddress,
      createdAt: new Date(session.createdAt).toISOString(),
      lastActiveAt: new Date(session.lastActivityAt).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      isCurrentSession: true,
    } : null;

    return {
      authenticated,
      mode: this.authMode,
      user,
      session: sessionInfo,
      tokenStatus,
    };
  }

  /**
   * 获取 Token 状态
   */
  async getTokenStatus(): Promise<TokenStatus> {
    return await this.tokenManager.getStatus();
  }

  /**
   * 获取会话状态
   */
  async getSessionStatus(): Promise<SessionStatus | null> {
    if (!this.sessionManager) {
      return null;
    }
    return await this.sessionManager.getStatus();
  }

  // ============================================
  // 2FA Methods
  // ============================================

  /**
   * 启用双因素认证
   * @description 仅在线模式可用
   */
  async enable2FA(method: string): Promise<AuthOperationResult> {
    this.logger.debug('Enable 2FA', { method });

    if (this.authMode === 'LOCAL') {
      return { success: false, error: '2FA requires online mode' };
    }

    // TODO: 实现在线 2FA
    return { success: false, error: '2FA not implemented yet' };
  }

  /**
   * 禁用双因素认证
   */
  async disable2FA(): Promise<AuthOperationResult> {
    this.logger.debug('Disable 2FA');
    return { success: false, error: '2FA not implemented yet' };
  }

  /**
   * 验证双因素认证
   */
  async verify2FA(code: string): Promise<AuthOperationResult> {
    this.logger.debug('Verify 2FA');
    return { success: false, error: '2FA not implemented yet' };
  }

  /**
   * 获取 2FA 状态
   */
  async get2FAStatus(): Promise<TwoFactorStatus> {
    this.logger.debug('Get 2FA status');
    return { enabled: false, method: null };
  }

  /**
   * 生成备份码
   */
  async generateBackupCodes(): Promise<{ codes: string[] }> {
    this.logger.debug('Generate backup codes');
    return { codes: [] };
  }

  // ============================================
  // API Keys Methods
  // ============================================

  /**
   * 创建 API Key
   */
  async createApiKey(request: { name: string; scopes?: string[] }): Promise<{ uuid: string; key: string } | null> {
    this.logger.debug('Create API key', { name: request.name });

    if (this.authMode === 'LOCAL') {
      return null; // API Keys 仅在线模式可用
    }

    // TODO: 实现在线 API Key 创建
    return null;
  }

  /**
   * 列出 API Keys
   */
  async listApiKeys(): Promise<{ apiKeys: ApiKeyInfo[]; total: number }> {
    this.logger.debug('List API keys');
    return { apiKeys: [], total: 0 };
  }

  /**
   * 撤销 API Key
   */
  async revokeApiKey(keyId: string): Promise<AuthOperationResult> {
    this.logger.debug('Revoke API key', { keyId });
    return { success: false, error: 'API keys not implemented yet' };
  }

  /**
   * 轮换 API Key
   */
  async rotateApiKey(keyId: string): Promise<{ newKey: string | null }> {
    this.logger.debug('Rotate API key', { keyId });
    return { newKey: null };
  }

  // ============================================
  // Sessions Methods
  // ============================================

  /**
   * 列出会话
   */
  async listSessions(): Promise<{ sessions: SessionInfo[]; total: number }> {
    this.logger.debug('List sessions');

    if (!this.sessionRepository) {
      return { sessions: [], total: 0 };
    }

    try {
      const currentSession = this.sessionManager?.getCurrentSession();
      if (!currentSession) {
        return { sessions: [], total: 0 };
      }

      const sessions = await this.sessionRepository.findByAccountUuid(currentSession.accountUuid);
      const sessionInfos: SessionInfo[] = sessions.map(s => ({
        uuid: s.uuid,
        deviceName: (s.device as any)?.deviceId ?? 'Unknown',
        deviceType: (s.device as any)?.deviceType ?? 'UNKNOWN',
        ipAddress: s.ipAddress,
        createdAt: new Date(s.createdAt).toISOString(),
        lastActiveAt: new Date(s.lastActivityAt).toISOString(),
        expiresAt: new Date(s.expiresAt).toISOString(),
        isCurrentSession: s.uuid === currentSession.uuid,
      }));

      return { sessions: sessionInfos, total: sessionInfos.length };
    } catch (error) {
      this.logger.error('Failed to list sessions', { error });
      return { sessions: [], total: 0 };
    }
  }

  /**
   * 获取当前会话
   */
  async getCurrentSession(): Promise<SessionInfo | null> {
    this.logger.debug('Get current session');

    const session = this.sessionManager?.getCurrentSession();
    if (!session) {
      return null;
    }

    return {
      uuid: session.uuid,
      deviceName: (session.device as any)?.deviceId ?? 'Unknown',
      deviceType: (session.device as any)?.deviceType ?? 'DESKTOP',
      ipAddress: session.ipAddress,
      createdAt: new Date(session.createdAt).toISOString(),
      lastActiveAt: new Date(session.lastActivityAt).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      isCurrentSession: true,
    };
  }

  /**
   * 撤销会话
   */
  async revokeSession(sessionId: string): Promise<AuthOperationResult> {
    this.logger.debug('Revoke session', { sessionId });

    if (!this.sessionRepository) {
      return { success: false, error: 'Service not initialized' };
    }

    try {
      const session = await this.sessionRepository.findByUuid(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // 不能撤销当前会话
      const currentSession = this.sessionManager?.getCurrentSession();
      if (currentSession && session.uuid === currentSession.uuid) {
        return { success: false, error: 'Cannot revoke current session, use logout instead' };
      }

      session.revoke();
      await this.sessionRepository.save(session);

      this.logger.info('Session revoked', { sessionId });
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to revoke session', { error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * 撤销所有会话
   */
  async revokeAllSessions(): Promise<{ success: boolean; count: number }> {
    this.logger.debug('Revoke all sessions');

    if (!this.sessionManager) {
      return { success: false, count: 0 };
    }

    try {
      const currentSession = this.sessionManager.getCurrentSession();
      if (!currentSession) {
        return { success: true, count: 0 };
      }

      const count = await this.sessionManager.cleanupOtherSessions(currentSession.accountUuid);
      return { success: true, count };
    } catch (error) {
      this.logger.error('Failed to revoke all sessions', { error });
      return { success: false, count: 0 };
    }
  }

  // ============================================
  // Devices Methods
  // ============================================

  /**
   * 列出设备
   */
  async listDevices(): Promise<{ devices: DeviceInfo[]; total: number }> {
    this.logger.debug('List devices');

    const deviceInfo = this.sessionManager?.getDeviceInfo();
    if (!deviceInfo) {
      return { devices: [], total: 0 };
    }

    const currentDevice: DeviceInfo = {
      uuid: deviceInfo.deviceId,
      name: deviceInfo.deviceName ?? 'Desktop App',
      type: deviceInfo.deviceType,
      os: deviceInfo.os ?? undefined,
      fingerprint: deviceInfo.deviceFingerprint ?? undefined,
    };

    return { devices: [currentDevice], total: 1 };
  }

  /**
   * 获取当前设备
   */
  async getCurrentDevice(): Promise<DeviceInfo> {
    this.logger.debug('Get current device');

    const deviceInfo = this.sessionManager?.getDeviceInfo();
    if (!deviceInfo) {
      return {
        uuid: 'unknown',
        name: 'Desktop App',
        type: 'DESKTOP',
      };
    }

    return {
      uuid: deviceInfo.deviceId,
      name: deviceInfo.deviceName ?? 'Desktop App',
      type: deviceInfo.deviceType,
      os: deviceInfo.os ?? undefined,
      fingerprint: deviceInfo.deviceFingerprint ?? undefined,
    };
  }

  /**
   * 撤销设备
   */
  async revokeDevice(deviceId: string): Promise<AuthOperationResult> {
    this.logger.debug('Revoke device', { deviceId });

    const currentDevice = this.sessionManager?.getDeviceInfo();
    if (currentDevice && deviceId === currentDevice.deviceId) {
      return { success: false, error: 'Cannot revoke current device' };
    }

    // TODO: 实现跨设备撤销
    return { success: false, error: 'Device revocation not implemented for other devices' };
  }

  /**
   * 重命名设备
   */
  async renameDevice(deviceId: string, name: string): Promise<AuthOperationResult> {
    this.logger.debug('Rename device', { deviceId, name });

    // TODO: 持久化设备名称
    return { success: true };
  }

  // ============================================
  // Cleanup Methods
  // ============================================

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    if (!this.sessionManager) {
      return 0;
    }
    return await this.sessionManager.cleanupExpiredSessions();
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.logger.info('Cleaning up AuthDesktopApplicationService');
    this.sessionManager?.cleanup();
    this.isInitialized = false;
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
