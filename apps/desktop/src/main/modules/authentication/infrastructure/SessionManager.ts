/**
 * SessionManager - 会话管理�?
 *
 * 负责会话的恢复、自动登录、定期清理等功能
 * 整合 TokenManager �?Repository，提供完整的会话生命周期管理
 *
 * 核心功能�?
 * - 应用启动时恢复上次会�?
 * - 使用 Remember-Me Token 实现自动登录
 * - 会话状态监控和自动刷新
 * - 过期会话清理
 * - 设备指纹管理
 */

import { app } from 'electron';
import { machineIdSync } from 'node-machine-id';
import * as os from 'os';
import { createLogger, generateUUID, type ILogger } from '@dailyuse/utils';
import { AuthSession, DeviceInfo } from '@dailyuse/domain-server/authentication';
import type { IAuthSessionRepository, IAuthCredentialRepository } from '@dailyuse/domain-server/authentication';
import type {
  TokenStorageData,
  TokenStatus,
  SessionRestoreResult as ContractSessionRestoreResult,
  AutoLoginResult as ContractAutoLoginResult,
  SessionStatusDTO,
  RefreshSessionRequest,
  RefreshSessionResponse,
  LoginRequest,
  LoginResponse,
  DeviceInfoClientDTO,
} from '@dailyuse/contracts/authentication';
import { TokenManager, getTokenManager, type TokenData } from './TokenManager';

// ============ Internal Types ============

/**
 * 扩展的会话恢复结果（包含领域对象�?
 */
export interface SessionRestoreResult extends ContractSessionRestoreResult {
  session?: AuthSession;
}

/**
 * 扩展的自动登录结果（包含领域对象�?
 */
export interface AutoLoginResult extends ContractAutoLoginResult {
  session?: AuthSession;
}

/**
 * 会话状态（扩展 DTO 包含设备信息�?
 */
export interface SessionStatus extends Omit<SessionStatusDTO, 'device'> {
  device: DeviceInfoClientDTO;
}

// ============ SessionManager ============

/**
 * 会话管理�?
 *
 * 提供完整的会话生命周期管理，包括�?
 * - 会话恢复和自动登�?
 * - Token 刷新和状态监�?
 * - 设备信息管理
 * - 会话清理
 */
export class SessionManager {
  private static instance: SessionManager | null = null;

  private readonly logger: ILogger;
  private readonly tokenManager: TokenManager;
  private readonly sessionRepository: IAuthSessionRepository;
  private readonly credentialRepository: IAuthCredentialRepository;

  private currentSession: AuthSession | null = null;
  private deviceInfo: DeviceInfoClientDTO | null = null;
  private isInitialized = false;
  private activityTimer: NodeJS.Timeout | null = null;

  // API 回调（用于与后端通信�?
  private apiRefreshToken: ((request: RefreshSessionRequest) => Promise<RefreshSessionResponse>) | null = null;
  private apiLogin: ((request: LoginRequest) => Promise<LoginResponse>) | null = null;

  private constructor(
    sessionRepository: IAuthSessionRepository,
    credentialRepository: IAuthCredentialRepository,
    logger?: ILogger,
  ) {
    this.logger = logger || createLogger('SessionManager');
    this.tokenManager = getTokenManager(this.logger);
    this.sessionRepository = sessionRepository;
    this.credentialRepository = credentialRepository;

    this.logger.info('SessionManager created');
  }

  /**
   * 获取单例实例
   */
  static getInstance(
    sessionRepository: IAuthSessionRepository,
    credentialRepository: IAuthCredentialRepository,
    logger?: ILogger,
  ): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(sessionRepository, credentialRepository, logger);
    }
    return SessionManager.instance;
  }

  /**
   * 重置单例（仅用于测试�?
   */
  static resetInstance(): void {
    if (SessionManager.instance) {
      SessionManager.instance.cleanup();
      SessionManager.instance = null;
    }
  }

  // ============ Initialization ============

  /**
   * 初始�?SessionManager
   *
   * 应在应用启动时调用，执行�?
   * 1. 生成设备信息
   * 2. 尝试恢复上次会话
   * 3. 启动自动刷新
   */
  async initialize(): Promise<SessionRestoreResult> {
    if (this.isInitialized) {
      this.logger.warn('SessionManager already initialized');
      return {
        success: true,
        session: this.currentSession ?? undefined,
        accountUuid: this.currentSession?.accountUuid,
      };
    }

    this.logger.info('Initializing SessionManager');

    // 1. 生成设备信息
    this.deviceInfo = this.generateDeviceInfo();
    this.logger.debug('Device info generated', { deviceId: this.deviceInfo.deviceId });

    // 2. 尝试恢复会话
    const restoreResult = await this.restoreSession();

    // 3. 如果有有效会话，启动自动刷新
    if (restoreResult.success && this.currentSession) {
      this.startAutoRefresh();
      this.startActivityTracking();
    }

    this.isInitialized = true;
    this.logger.info('SessionManager initialized', {
      hasSession: restoreResult.success,
      accountUuid: restoreResult.accountUuid,
    });

    return restoreResult;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.logger.info('Cleaning up SessionManager');
    this.stopAutoRefresh();
    this.stopActivityTracking();
    this.currentSession = null;
    this.isInitialized = false;
  }

  // ============ Session Restore ============

  /**
   * 恢复会话
   *
   * 尝试从本地存储恢复上次的会话�?
   * 1. 加载 Token
   * 2. 查找对应的会话记�?
   * 3. 验证会话有效�?
   * 4. 如果 Access Token 过期�?Refresh Token 有效，标记需要刷�?
   */
  async restoreSession(): Promise<SessionRestoreResult> {
    this.logger.info('Attempting to restore session');

    try {
      // 1. 加载 Token
      const tokenData = await this.tokenManager.loadTokens();
      if (!tokenData) {
        this.logger.info('No tokens found, no session to restore');
        return { success: false, needsReLogin: true };
      }

      // 2. 检�?Refresh Token 是否过期
      const now = Date.now();
      if (now > tokenData.refreshTokenExpiresAt) {
        this.logger.info('Refresh token expired, need re-login');
        await this.tokenManager.clearTokens();
        return { success: false, needsReLogin: true };
      }

      // 3. 查找会话记录
      const session = await this.sessionRepository.findByUuid(tokenData.sessionUuid);
      if (!session) {
        this.logger.warn('Session not found in database', { sessionUuid: tokenData.sessionUuid });
        // 尝试通过账户查找最近的活跃会话
        const activeSessions = await this.sessionRepository.findActiveSessions(tokenData.accountUuid);
        if (activeSessions.length === 0) {
          this.logger.info('No active sessions found for account');
          await this.tokenManager.clearTokens();
          return { success: false, needsReLogin: true };
        }
        // 使用最近的活跃会话
        this.currentSession = activeSessions[0];
      } else {
        // 4. 验证会话有效�?
        if (!session.isValid()) {
          this.logger.info('Session is invalid (revoked/expired)');
          await this.tokenManager.clearTokens();
          return { success: false, needsReLogin: true };
        }
        this.currentSession = session;
      }

      // 5. 检查是否需要刷�?Access Token
      const needsRefresh = now > tokenData.accessTokenExpiresAt;
      if (needsRefresh) {
        this.logger.info('Access token expired, needs refresh');
      }

      this.logger.info('Session restored successfully', {
        sessionUuid: this.currentSession.uuid,
        accountUuid: this.currentSession.accountUuid,
        needsRefresh,
      });

      return {
        success: true,
        session: this.currentSession,
        accountUuid: this.currentSession.accountUuid,
        needsRefresh,
      };
    } catch (error) {
      this.logger.error('Failed to restore session', { error });
      return { success: false, error: String(error), needsReLogin: true };
    }
  }

  // ============ Auto Login ============

  /**
   * 自动登录
   *
   * 使用存储�?Refresh Token 自动刷新会话�?
   * 1. 检查是否有有效�?Refresh Token
   * 2. 调用 API 刷新 Token
   * 3. 更新本地会话�?Token 存储
   */
  async autoLogin(): Promise<AutoLoginResult> {
    this.logger.info('Attempting auto login');

    try {
      // 1. 检�?Token
      const tokenData = await this.tokenManager.loadTokens();
      if (!tokenData) {
        return { success: false, authenticated: false, error: 'No tokens available' };
      }

      // 2. 检�?Refresh Token 是否过期
      if (Date.now() > tokenData.refreshTokenExpiresAt) {
        this.logger.info('Refresh token expired');
        await this.tokenManager.clearTokens();
        return { success: false, authenticated: false, error: 'Refresh token expired' };
      }

      // 3. 如果 Access Token 仍然有效，直接恢复会�?
      if (Date.now() < tokenData.accessTokenExpiresAt) {
        const restoreResult = await this.restoreSession();
        if (restoreResult.success) {
          return {
            success: true,
            authenticated: true,
            session: restoreResult.session,
            accountUuid: restoreResult.accountUuid,
            isNewSession: false,
          };
        }
      }

      // 4. 需要刷�?Token
      const refreshResult = await this.refreshSession();
      if (!refreshResult.success) {
        return { success: false, authenticated: false, error: refreshResult.error };
      }

      return {
        success: true,
        authenticated: true,
        session: this.currentSession ?? undefined,
        accountUuid: this.currentSession?.accountUuid,
        isNewSession: false,
      };
    } catch (error) {
      this.logger.error('Auto login failed', { error });
      return { success: false, authenticated: false, error: String(error) };
    }
  }

  // ============ Session Refresh ============

  /**
   * 刷新会话
   *
   * 使用 Refresh Token 获取新的 Access Token
   */
  async refreshSession(): Promise<RefreshSessionResponse> {
    this.logger.info('Refreshing session');

    try {
      const tokenData = await this.tokenManager.loadTokens();
      if (!tokenData) {
        return { success: false, error: 'No tokens to refresh' };
      }

      // 如果没有 API 回调，使用本地刷�?
      if (!this.apiRefreshToken) {
        return await this.localRefresh(tokenData);
      }

      // 调用 API 刷新
      const result = await this.apiRefreshToken({
        refreshToken: tokenData.refreshToken,
        sessionUuid: tokenData.sessionUuid,
      });

      if (result.success && result.accessToken) {
        // 更新 Token
        await this.tokenManager.updateAccessToken(result.accessToken, result.expiresIn ?? 3600);

        // 如果返回了新�?Refresh Token（Sliding Window），也更新它
        if (result.refreshToken) {
          await this.tokenManager.updateRefreshToken(result.refreshToken);
        }

        // 更新会话
        if (this.currentSession) {
          this.currentSession.refreshAccessToken(result.accessToken, (result.expiresIn ?? 3600) / 60);
          await this.sessionRepository.save(this.currentSession);
        }

        this.logger.info('Session refreshed successfully via API');
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to refresh session', { error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * 本地刷新（离线模式）
   *
   * 在离线模式下，只是延长本地会话的有效�?
   */
  private async localRefresh(tokenData: TokenData): Promise<RefreshSessionResponse> {
    this.logger.info('Performing local refresh (offline mode)');

    // 生成新的本地 Token（实际上只是更新过期时间�?
    const newExpiresIn = 3600; // 1 小时
    await this.tokenManager.updateAccessToken(tokenData.accessToken, newExpiresIn);

    // 更新会话
    if (this.currentSession) {
      this.currentSession.refreshAccessToken(tokenData.accessToken, newExpiresIn / 60);
      await this.sessionRepository.save(this.currentSession);
    }

    return {
      success: true,
      accessToken: tokenData.accessToken,
      expiresIn: newExpiresIn,
    };
  }

  // ============ Login/Logout ============

  /**
   * 登录
   *
   * @param request - 登录请求
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    this.logger.info('Login attempt', { identifier: request.identifier });

    try {
      // 如果�?API 回调，使用远程登�?
      if (this.apiLogin) {
        const result = await this.apiLogin(request);
        if (result.success && result.accessToken && result.refreshToken) {
          // 保存 Token
          await this.tokenManager.saveTokens({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            accessTokenExpiresIn: result.expiresIn ?? 3600,
            accountUuid: result.accountUuid!,
            sessionUuid: result.sessionId ?? generateUUID(),
          });

          // 保存会话
          

          // 启动自动刷新
          this.startAutoRefresh();
          this.startActivityTracking();

          this.logger.info('Login successful', { accountUuid: result.accountUuid });
        }
        return result;
      }

      // 离线模式：使用本地账�?
      return await this.localLogin(request);
    } catch (error) {
      this.logger.error('Login failed', { error });
      return { success: false, error: String(error) };
    }
  }

  /**
   * 本地登录（离线模式）
   *
   * 创建本地会话，不需要远程验�?
   */
  private async localLogin(request: LoginRequest): Promise<LoginResponse> {
    this.logger.info('Performing local login (offline mode)');

    // 在离线模式下，我们创建一个本地会�?
    // 实际的密码验证应该在 AuthCredential 中完�?
    const deviceInfo = this.getDeviceInfo();

    // 使用 DeviceInfo 值对象创建设备信�?
    const device = DeviceInfo.create({
      deviceType: 'DESKTOP',
      os: deviceInfo.os ?? undefined,
      browser: deviceInfo.appVersion ?? undefined,
      ipAddress: '127.0.0.1',
    });

    // 创建会话
    const session = AuthSession.create({
      accountUuid: `local-${request.identifier}`,
      accessToken: generateUUID(),
      refreshToken: generateUUID(),
      device,
      ipAddress: '127.0.0.1',
    });

    // 保存会话
    await this.sessionRepository.save(session);
    this.currentSession = session;

    // 保存 Token
    await this.tokenManager.saveTokens({
      accessToken: session.accessToken,
      refreshToken: (session.refreshToken as any).token,
      accessTokenExpiresIn: 3600, // 1 小时
      refreshTokenExpiresIn: 30 * 24 * 3600, // 30 �?
      accountUuid: session.accountUuid,
      sessionUuid: session.uuid,
    });

    // 启动自动刷新
    this.startAutoRefresh();
    this.startActivityTracking();

    this.logger.info('Local login successful', { accountUuid: session.accountUuid });

    return {
      success: true,
      sessionId: session.uuid,
      accessToken: session.accessToken,
      accountUuid: session.accountUuid,
      expiresIn: 3600,
    };
  }

  /**
   * 登出
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    this.logger.info('Logout');

    try {
      // 停止自动刷新
      this.stopAutoRefresh();
      this.stopActivityTracking();

      // 撤销当前会话
      if (this.currentSession) {
        this.currentSession.revoke();
        await this.sessionRepository.save(this.currentSession);
      }

      // 清除 Token
      await this.tokenManager.clearTokens();

      // 清除当前会话
      this.currentSession = null;

      this.logger.info('Logout successful');
      return { success: true };
    } catch (error) {
      this.logger.error('Logout failed', { error });
      return { success: false, error: String(error) };
    }
  }

  // ============ Session Status ============

  /**
   * 获取会话状�?
   */
  async getStatus(): Promise<SessionStatus> {
    const tokenStatus = await this.tokenManager.getStatus();
    const deviceInfo = this.getDeviceInfo();

    return {
      hasActiveSession: this.currentSession?.isValid() ?? false,
      sessionUuid: this.currentSession?.uuid,
      accountUuid: this.currentSession?.accountUuid,
      tokenStatus,
      device: deviceInfo,
      lastActivityAt: this.currentSession?.lastActivityAt,
      sessionCreatedAt: this.currentSession?.createdAt,
      sessionExpiresAt: this.currentSession?.expiresAt,
    };
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo(): DeviceInfoClientDTO {
    if (!this.deviceInfo) {
      this.deviceInfo = this.generateDeviceInfo();
    }
    return this.deviceInfo;
  }

  // ============ Cleanup ============

  /**
   * 清理过期会话
   *
   * 删除所有过期的会话记录
   */
  async cleanupExpiredSessions(): Promise<number> {
    this.logger.info('Cleaning up expired sessions');

    try {
      const deletedCount = await this.sessionRepository.deleteExpired();
      this.logger.info('Expired sessions cleaned up', { count: deletedCount });
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup expired sessions', { error });
      return 0;
    }
  }

  /**
   * 清理账户的所有会话（除当前会话外�?
   */
  async cleanupOtherSessions(accountUuid: string): Promise<number> {
    this.logger.info('Cleaning up other sessions', { accountUuid });

    try {
      const sessions = await this.sessionRepository.findByAccountUuid(accountUuid);
      let cleanedCount = 0;

      for (const session of sessions) {
        if (session.uuid !== this.currentSession?.uuid) {
          session.revoke();
          await this.sessionRepository.save(session);
          cleanedCount++;
        }
      }

      this.logger.info('Other sessions cleaned up', { count: cleanedCount });
      return cleanedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup other sessions', { error });
      return 0;
    }
  }

  // ============ API Callbacks ============

  /**
   * 设置 API 回调
   */
  setApiCallbacks(callbacks: {
    refreshToken?: (request: RefreshSessionRequest) => Promise<RefreshSessionResponse>;
    login?: (request: LoginRequest) => Promise<LoginResponse>;
  }): void {
    this.apiRefreshToken = callbacks.refreshToken ?? null;
    this.apiLogin = callbacks.login ?? null;
    this.logger.debug('API callbacks set');
  }

  // ============ Private Methods ============

  /**
   * 生成设备信息
   */
  private generateDeviceInfo(): DeviceInfoClientDTO {
    const machineId = machineIdSync(true);
    const platform = os.platform();
    const release = os.release();
    const hostname = os.hostname();
    const now = Date.now();

    return {
      deviceId: machineId,
      deviceFingerprint: this.generateFingerprint(machineId, platform, hostname),
      deviceType: 'DESKTOP',
      deviceName: hostname,
      os: platform,
      osVersion: release,
      appVersion: app.getVersion(),
      firstSeenAt: now,
      lastSeenAt: now,
    };
  }

  /**
   * 生成设备指纹
   */
  private generateFingerprint(machineId: string, platform: string, hostname: string): string {
    const crypto = require('crypto');
    const data = `${machineId}-${platform}-${hostname}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 启动自动刷新
   */
  private startAutoRefresh(): void {
    this.tokenManager.startAutoRefresh(async () => {
      const result = await this.refreshSession();
      return {
        success: result.success,
        accessToken: result.accessToken,
        expiresAt: result.expiresIn ? Date.now() + result.expiresIn * 1000 : undefined,
        error: result.error,
      };
    });
  }

  /**
   * 停止自动刷新
   */
  private stopAutoRefresh(): void {
    this.tokenManager.stopAutoRefresh();
  }

  /**
   * 启动活动追踪
   */
  private startActivityTracking(): void {
    // �?5 分钟记录一次活�?
    this.activityTimer = setInterval(async () => {
      if (this.currentSession) {
        this.currentSession.recordActivity('HEARTBEAT');
        await this.sessionRepository.save(this.currentSession);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * 停止活动追踪
   */
  private stopActivityTracking(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }
}

// ============ Factory Function ============

/**
 * 创建 SessionManager 实例
 */
export function createSessionManager(
  sessionRepository: IAuthSessionRepository,
  credentialRepository: IAuthCredentialRepository,
  logger?: ILogger,
): SessionManager {
  return SessionManager.getInstance(sessionRepository, credentialRepository, logger);
}

