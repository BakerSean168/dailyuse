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

import crypto from 'node:crypto';
import { app } from 'electron';
import { machineIdSync } from 'node-machine-id';
import * as os from 'os';
import { createLogger, generateUUID, type ILogger } from '@dailyuse/utils';
import { AuthIdentity, AuthSession } from '@dailyuse/authentication/domain-server';
import type { IdentityId, AuthSessionId } from '@dailyuse/contracts/authentication';
import { DeviceInfo } from '@dailyuse/authentication/domain-shared';
import type {
  IAuthSessionRepository,
  IAuthIdentityRepository,
} from '@dailyuse/authentication/domain-server';
import type { IPasswordHasher } from '@dailyuse/authentication/domain-shared';
import {
  AuthMode,
  type TokenStorageData,
  type TokenStatus,
  type SessionRestoreResult as ContractSessionRestoreResult,
  type AutoLoginResult as ContractAutoLoginResult,
  type SessionStatusDTO,
  type RefreshSessionRequest,
  type RefreshSessionResponse,
  type LoginRequest,
  type LoginResponse,
  type DeviceInfoClientDTO,
} from '@dailyuse/contracts/authentication';
import { TokenManager, getTokenManager, type TokenData } from './TokenManager';
import { getNetworkStateManager } from './NetworkStateManager';

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

  // Offline credential infrastructure (Phase 2)
  private identityRepository: IAuthIdentityRepository | null = null;
  private passwordHasher: IPasswordHasher | null = null;
  // Maps email → server-side identityId for offline session creation
  // (No longer needed — local AuthIdentity is now stored with the server ID directly)

  // Guest identity persistence (Phase 4)
  private static readonly GUEST_ID_KEY = 'guest_identity_id';

  private currentSession: AuthSession | null = null;
  private deviceInfo: DeviceInfoClientDTO | null = null;
  private isInitialized = false;
  private activityTimer: NodeJS.Timeout | null = null;

  // API 回调（用于与后端通信�?
  private apiRefreshToken:
    | ((request: RefreshSessionRequest) => Promise<RefreshSessionResponse>)
    | null = null;
  private apiLogin: ((request: LoginRequest) => Promise<LoginResponse>) | null = null;

  private constructor(
    sessionRepository: IAuthSessionRepository,
    identityRepository: IAuthIdentityRepository,
    logger?: ILogger,
  ) {
    this.logger = logger || createLogger('SessionManager');
    this.tokenManager = getTokenManager(this.logger);
    this.sessionRepository = sessionRepository;
    this.identityRepository = identityRepository;

    this.logger.info('SessionManager created');
  }

  /**
   * 获取单例实例
   */
  static getInstance(
    sessionRepository: IAuthSessionRepository,
    identityRepository: IAuthIdentityRepository,
    logger?: ILogger,
  ): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(sessionRepository, identityRepository, logger);
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
        ok: true,
        session: this.currentSession ?? undefined,
        identityId: this.currentSession?.identityId,
      };
    }

    this.logger.info('Initializing SessionManager');

    // 1. 生成设备信息
    this.deviceInfo = this.generateDeviceInfo();
    this.logger.debug('Device info generated', { deviceId: this.deviceInfo.deviceId });

    // 2. 尝试恢复会话
    const restoreResult = await this.restoreSession();

    // 3. 如果有有效会话，启动自动刷新
    if (restoreResult.ok && this.currentSession) {
      this.startAutoRefresh();
      this.startActivityTracking();
    }

    this.isInitialized = true;
    this.logger.info('SessionManager initialized', {
      hasSession: restoreResult.ok,
      identityId: restoreResult.identityId,
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
        return { ok: false, needsReLogin: true };
      }

      // 2. 检�?Refresh Token 是否过期
      const now = Date.now();
      if (now > tokenData.refreshTokenExpiresAt) {
        this.logger.info('Refresh token expired, need re-login');
        await this.tokenManager.clearTokens();
        return { ok: false, needsReLogin: true };
      }

      // 3. 查找会话记录
      const session = await this.sessionRepository.findById(
        tokenData.sessionId as unknown as AuthSessionId,
      );
      if (!session) {
        this.logger.warn('Session not found in database', { sessionId: tokenData.sessionId });
        // 尝试通过账户查找最近的活跃会话
        const activeSessions = await this.sessionRepository.findByIdentityId(
          tokenData.identityId as unknown as IdentityId,
        );
        if (activeSessions.length === 0) {
          this.logger.info('No persisted session found, reconstructing runtime session from token');
          this.currentSession = await this.restoreRuntimeSessionFromToken(tokenData);
        } else {
          // 使用最近的活跃会话
          this.currentSession = activeSessions[0];
        }
      } else {
        // 4. 验证会话有效�?
        if (!session.isValid()) {
          this.logger.info('Session is invalid (revoked/expired)');
          await this.tokenManager.clearTokens();
          return { ok: false, needsReLogin: true };
        }
        this.currentSession = session;
      }

      // 5. 检查是否需要刷�?Access Token
      const needsRefresh = now > tokenData.accessTokenExpiresAt;
      if (needsRefresh) {
        this.logger.info('Access token expired, needs refresh');
      }

      this.logger.info('Session restored successfully', {
        sessionId: this.currentSession.id,
        identityId: this.currentSession.identityId,
        needsRefresh,
      });

      return {
        ok: true,
        session: this.currentSession,
        identityId: this.currentSession.identityId,
        needsRefresh,
      };
    } catch (error) {
      this.logger.error('Failed to restore session', { error });
      return { ok: false, error: String(error), needsReLogin: true };
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
        return { ok: false, authenticated: false, error: 'No tokens available' };
      }

      // 2. 检查 Refresh Token 是否过期
      if (Date.now() > tokenData.refreshTokenExpiresAt) {
        this.logger.info('Refresh token expired');
        await this.tokenManager.clearTokens();
        return { ok: false, authenticated: false, error: 'Refresh token expired' };
      }

      // 3. 如果 Access Token 仍然有效，直接恢复会话
      if (Date.now() < tokenData.accessTokenExpiresAt) {
        const restoreResult = await this.restoreSession();
        if (restoreResult.ok) {
          return {
            ok: true,
            authenticated: true,
            session: restoreResult.session,
            identityId: restoreResult.identityId,
            isNewSession: false,
          };
        }
      }

      // 4. 需要刷�?Token
      const refreshResult = await this.refreshSession();
      if (!refreshResult.ok) {
        return { ok: false, authenticated: false, error: refreshResult.error };
      }

      return {
        ok: true,
        authenticated: true,
        session: this.currentSession ?? undefined,
        identityId: this.currentSession?.identityId,
        isNewSession: false,
      };
    } catch (error) {
      this.logger.error('Auto login failed', { error });
      return { ok: false, authenticated: false, error: String(error) };
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
        return { ok: false, error: 'No tokens to refresh' };
      }

      // 如果没有 API 回调，使用本地刷新
      if (!this.apiRefreshToken) {
        return await this.localRefresh(tokenData);
      }

      // 调用 API 刷新
      const result = await this.apiRefreshToken({
        refreshToken: tokenData.refreshToken,
        sessionId: tokenData.sessionId,
      });

      if (result.ok && result.accessToken) {
        // 更新 Token
        await this.tokenManager.updateAccessToken(result.accessToken, result.expiresIn ?? 3600);

        // 如果返回了新�?Refresh Token（Sliding Window），也更新它
        if (result.refreshToken) {
          await this.tokenManager.updateRefreshToken(result.refreshToken);
        }

        // 更新会话
        if (this.currentSession) {
          this.currentSession.updateRefreshTokenHash(result.accessToken);
          await this.sessionRepository.save(this.currentSession);
        }

        this.logger.info('Session refreshed successfully via API');
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to refresh session', { error });
      return { ok: false, error: String(error) };
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
      this.currentSession.updateRefreshTokenHash(tokenData.accessToken);
      await this.sessionRepository.save(this.currentSession);
    }

    return {
      ok: true,
      accessToken: 'local-token',
      expiresIn: newExpiresIn,
    };
  }

  // ============ Login/Logout ============

  /**
   * 登录 (Network-Aware Hybrid)
   *
   * 1. 在线时：尝试远程 API 登录 → 成功后缓存离线凭据 → ONLINE_USER
   * 2. 在线但远程失败（网络错误）：降级到本地验证 → OFFLINE_USER
   * 3. 在线但认证失败（401/403）：直接返回错误，不降级
   * 4. 离线时：使用本地存储的凭据验证 → OFFLINE_USER
   * 5. 无本地凭据：返回错误提示需要首次在线登录
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    this.logger.info('Login attempt', { identifier: request.identifier });

    try {
      const networkManager = getNetworkStateManager();
      const isOnline = networkManager.isOnline();

      // Online path: try remote API first
      if (isOnline && this.apiLogin) {
        try {
          const result = await this.apiLogin(request);

          if (result.ok && result.accessToken && result.refreshToken) {
            // Remote login succeeded
            await this.tokenManager.saveTokens({
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              accessTokenExpiresIn: result.expiresIn ?? 3600,
              identityId: result.identityId!,
              sessionId: result.sessionId ?? generateUUID(),
            });

            // Cache offline credentials for future offline login
            if (request.password) {
              this.saveOfflineCredentials(
                request.identifier,
                request.password,
                result.identityId!,
              ).catch((err) =>
                this.logger.warn('Failed to cache offline credentials', { error: err }),
              );
            }

            // Create local session so getCurrentSession() works after online login
            await this.createOnlineSession({
              identityId: result.identityId!,
              sessionId: result.sessionId ?? generateUUID(),
              expiresIn: result.expiresIn ?? 3600,
            });

            this.startAutoRefresh();
            this.startActivityTracking();

            this.logger.info('Online login successful', { identityId: result.identityId });
            return { ...result, authMode: AuthMode.ONLINE_USER };
          }

          // Auth error (wrong password, account disabled, etc.) — do NOT fall back
          if (result.error) {
            this.logger.info('Remote auth failed, no fallback', { error: result.error });
            return result;
          }
        } catch (error) {
          // Network/fetch error — fall through to offline verification
          this.logger.info('Remote login network error, attempting offline fallback', { error });
        }
      }

      // Offline path: verify against locally cached credentials
      return await this.localLogin(request);
    } catch (error) {
      this.logger.error('Login failed', { error });
      return { ok: false, error: String(error) };
    }
  }

  /**
   * 本地登录（离线密码验证）
   *
   * 使用本地 AuthIdentity + Argon2 验证密码，
   * 创建本地会话，返回 OFFLINE_USER 模式。
   */
  private async localLogin(request: LoginRequest): Promise<LoginResponse> {
    this.logger.info('Attempting local login', { identifier: request.identifier });

    // Verify password against locally cached credentials
    const verification = await this.verifyOfflineCredentials(request.identifier, request.password);

    if (!verification.ok) {
      const errorMessages: Record<string, string> = {
        NO_LOCAL_CREDENTIALS: '需要首次在线登录以缓存凭据',
        INVALID_PASSWORD: '密码错误',
        ACCOUNT_LOCKED: '账户已锁定，请稍后重试',
        OFFLINE_AUTH_UNAVAILABLE: '离线认证服务不可用',
        OFFLINE_STORAGE_ERROR: '内部错误，请联系开发者',
      };
      return {
        ok: false,
        error: errorMessages[verification.error!] ?? verification.error,
        authMode: AuthMode.UNAUTHENTICATED,
      };
    }

    // Create local session with real identity ID
    const deviceInfo = this.getDeviceInfo();
    const device = DeviceInfo.create(deviceInfo as any);

    const session = AuthSession.create({
      id: generateUUID() as unknown as AuthSessionId,
      identityId: verification.identityId! as unknown as IdentityId,
      refreshTokenHash: generateUUID(),
      expiresAt: Date.now() + 3600 * 1000,

      deviceInfo: device.toDTO(),
    });

    await this.sessionRepository.save(session);
    this.currentSession = session;

    await this.tokenManager.saveTokens({
      accessToken: 'local-token',
      refreshToken: 'local-token',
      accessTokenExpiresIn: 3600,
      refreshTokenExpiresIn: 30 * 24 * 3600,
      identityId: session?.identityId,
      sessionId: session?.id,
    });

    this.startAutoRefresh();
    this.startActivityTracking();

    this.logger.info('Local login successful', {
      identityId: session?.identityId,
      authMode: AuthMode.OFFLINE_USER,
    });

    return {
      ok: true,
      sessionId: session?.id,
      accessToken: 'local-token',
      identityId: session?.identityId,
      expiresIn: 3600,
      authMode: AuthMode.OFFLINE_USER,
    };
  }

  /**
   * 登出
   */
  async logout(): Promise<{ ok: boolean; error?: string }> {
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
      return { ok: true };
    } catch (error) {
      this.logger.error('Logout failed', { error });
      return { ok: false, error: String(error) };
    }
  }

  // ============ Online Session Creation ============

  /**
   * 创建在线登录会话
   *
   * 在线登录成功后调用，创建本地 AuthSession 并设置为当前会话。
   * 确保 getCurrentSession() / getCurrentIdentityId() 在在线登录后返回正确值。
   */
  async createOnlineSession(params: {
    identityId: string;
    sessionId: string;
    expiresIn?: number;
  }): Promise<void> {
    const deviceInfo = this.getDeviceInfo();
    const device = DeviceInfo.create(deviceInfo as any);

    const session = AuthSession.create({
      id: params.sessionId as unknown as AuthSessionId,
      identityId: params.identityId as unknown as IdentityId,
      refreshTokenHash: generateUUID(),
      expiresAt: Date.now() + (params.expiresIn ?? 3600) * 1000,
      deviceInfo: device.toDTO(),
    });

    await this.sessionRepository.save(session);
    this.currentSession = session;

    this.logger.info('Online session created', {
      identityId: params.identityId,
      sessionId: params.sessionId,
    });
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
      sessionId: this.currentSession?.id,
      identityId: this.currentSession?.identityId,
      tokenStatus,
      device: deviceInfo,
      lastActivityAt: this.currentSession?.lastActiveAt?.getTime(),
      sessionCreatedAt: this.currentSession?.createdAt?.getTime(),
      sessionExpiresAt: this.currentSession?.expiresAt?.getTime(),
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
      await this.sessionRepository.removeExpired();
      const deletedCount = 0;
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
  async cleanupOtherSessions(identityId: string): Promise<number> {
    this.logger.info('Cleaning up other sessions', { identityId });

    try {
      const sessions = await this.sessionRepository.findByIdentityId(
        identityId as unknown as IdentityId,
      );
      let cleanedCount = 0;

      for (const session of sessions) {
        if (session?.id !== this.currentSession?.id) {
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

  // ============ Offline Auth Dependencies ============

  /**
   * 注入离线认证依赖
   * @param identityRepository - 身份聚合根仓储（用于离线密码验证）
   * @param passwordHasher - 密码哈希器（Argon2）
   */
  setOfflineAuthDependencies(
    identityRepository: IAuthIdentityRepository,
    passwordHasher: IPasswordHasher,
  ): void {
    this.identityRepository = identityRepository;
    this.passwordHasher = passwordHasher;
    this.logger.info('Offline auth dependencies injected');
  }

  // ============ Offline Credential Management (Phase 2) ============

  /**
   * 保存离线凭据
   *
   * 在线登录/注册成功后调用，将用户的邮箱+密码哈希持久化到本地 SQLite，
   * 以便后续离线登录时验证。使用服务端的 identityId 以保持数据一致性。
   *
   * @param email - 用户邮箱
   * @param plainPassword - 用户明文密码（将使用 Argon2 本地哈希后存储）
   * @param identityId - 服务端返回的身份 ID（保持一致）
   */
  async saveOfflineCredentials(
    email: string,
    plainPassword: string,
    identityId: string,
  ): Promise<void> {
    if (!this.identityRepository || !this.passwordHasher) {
      this.logger.warn('Offline auth dependencies not available, skipping credential cache');
      return;
    }

    try {
      // Check if identity already exists locally
      const existing = await this.identityRepository.findByEmail(email);

      if (existing) {
        if (existing.id.toString() === identityId) {
          this.logger.debug('Offline credentials already cached with correct server ID', { email });
          return;
        }
        // Existing entry has wrong (locally-generated) ID — remove and recreate with server ID
        this.logger.info('Replacing offline credentials with correct server ID', {
          email,
          oldId: existing.id.toString(),
          newId: identityId,
        });
        await this.identityRepository.delete(existing);
      }

      // Create identity using the server's identity ID so local tables stay consistent
      const identity = await AuthIdentity.createWithEmailAndPassword({
        id: identityId as unknown as IdentityId,
        email,
        plainPassword,
        hasher: this.passwordHasher,
      });

      await this.identityRepository.save(identity);

      this.logger.info('Offline credentials cached successfully', { email, identityId });
    } catch (error) {
      this.logger.error('Failed to cache offline credentials', { error, email });
      throw error;
    }
  }

  async removeOfflineCredentials(email: string): Promise<void> {
    if (!this.identityRepository) {
      return;
    }

    const identity = await this.identityRepository.findByEmail(email);
    if (!identity) {
      return;
    }

    await this.identityRepository.delete(identity);
  }

  /**
   * 离线密码验证
   *
   * 使用本地存储的 AuthIdentity 验证用户密码。
   * 包含失败计数和锁定机制（由 AuthIdentity 聚合根管理）。
   * 返回服务端的 identityId（如果有映射），否则返回本地 ID。
   */
  private async verifyOfflineCredentials(
    email: string,
    plainPassword: string,
  ): Promise<{ ok: boolean; identityId?: string; error?: string }> {
    if (!this.identityRepository || !this.passwordHasher) {
      return { ok: false, error: 'OFFLINE_AUTH_UNAVAILABLE' };
    }

    let identity: AuthIdentity | null;
    try {
      identity = await this.identityRepository.findByEmail(email);
    } catch (error) {
      this.logger.error('Offline credential lookup failed', {
        email,
        error,
      });
      return { ok: false, error: 'OFFLINE_STORAGE_ERROR' };
    }

    if (!identity) {
      return { ok: false, error: 'NO_LOCAL_CREDENTIALS' };
    }

    // Check lockout
    if (identity.isLocked()) {
      return { ok: false, error: 'ACCOUNT_LOCKED' };
    }

    const verified = await identity.verifyPassword(plainPassword, this.passwordHasher);
    if (!verified) {
      identity.recordFailedLogin();
      try {
        await this.identityRepository.save(identity);
      } catch (error) {
        this.logger.error('Failed to persist failed-login state for offline identity', {
          identityId: identity.id.toString(),
          error,
        });
      }
      return { ok: false, error: 'INVALID_PASSWORD' };
    }

    // Success — reset failed attempts
    identity.resetFailedAttempts();
    try {
      await this.identityRepository.save(identity);
    } catch (error) {
      this.logger.error('Failed to persist reset-failed-attempts state for offline identity', {
        identityId: identity.id.toString(),
        error,
      });
      return { ok: false, error: 'OFFLINE_STORAGE_ERROR' };
    }

    // Use the identity's own ID for session creation.
    // Since saveOfflineCredentials now stores AuthIdentity with the server's ID,
    // identity.id IS the server ID — consistent with tokens, sessions, and accounts.
    return { ok: true, identityId: identity.id.toString() };
  }

  // ============ Guest Identity Management (Phase 4) ============

  /**
   * 获取或创建持久化的访客身份 ID
   *
   * 访客 ID 存储在 auth_sessions 元数据中，应用重启后保持不变。
   * 用户升级到云账户后可通过 clearGuestIdentity() 清除。
   */
  async getOrCreateGuestIdentity(): Promise<string> {
    // Try to load existing guest ID from session repository metadata
    const existingGuestSessions = await this.sessionRepository.findByIdentityId(
      'guest' as unknown as IdentityId,
    );
    if (existingGuestSessions.length > 0) {
      const guestSession = existingGuestSessions[0];
      this.currentSession = guestSession;
      this.logger.info('Restored existing guest identity', { sessionId: guestSession.id });
      return guestSession.identityId;
    }

    // Create new persistent guest identity
    const guestId = `guest-${this.getDeviceInfo().deviceId.substring(0, 8)}`;

    const deviceInfo = this.getDeviceInfo();
    const device = DeviceInfo.create(deviceInfo as any);

    const session = AuthSession.create({
      id: generateUUID() as unknown as AuthSessionId,
      identityId: guestId as unknown as IdentityId,
      refreshTokenHash: generateUUID(),
      expiresAt: Date.now() + 3600 * 1000,

      deviceInfo: device.toDTO(),
    });

    await this.sessionRepository.save(session);
    this.currentSession = session;

    // Save guest tokens locally
    await this.tokenManager.saveTokens({
      accessToken: 'local-token',
      refreshToken: 'local-token',
      accessTokenExpiresIn: 365 * 24 * 3600, // 1 year for guest
      refreshTokenExpiresIn: 365 * 24 * 3600,
      identityId: guestId as unknown as IdentityId,
      sessionId: session?.id,
    });

    this.logger.info('Created new guest identity', { guestId, sessionId: session?.id });
    return guestId;
  }

  /**
   * 清除访客身份（用户升级到云账户时调用）
   */
  async clearGuestIdentity(): Promise<void> {
    const guestSessions = await this.sessionRepository.findByIdentityId(
      'guest' as unknown as IdentityId,
    );
    for (const session of guestSessions) {
      session.revoke();
      await this.sessionRepository.save(session);
    }
    this.logger.info('Guest identity cleared');
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
      deviceType: 'Desktop',
      deviceName: hostname,
      os: platform,
      osVersion: release as string | undefined,
      appVersion: (app.getVersion() || null) as any,
      firstSeenAt: now,
      lastSeenAt: now,
    };
  }

  /**
   * 生成设备指纹
   */
  private generateFingerprint(machineId: string, platform: string, hostname: string): string {
    const data = `${machineId}-${platform}-${hostname}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async restoreRuntimeSessionFromToken(tokenData: TokenData): Promise<AuthSession> {
    const deviceInfo = this.getDeviceInfo();
    const device = DeviceInfo.create(deviceInfo as any);
    const expiresAt = Math.max(tokenData.accessTokenExpiresAt, tokenData.refreshTokenExpiresAt);

    const session = AuthSession.create({
      id: tokenData.sessionId as unknown as AuthSessionId,
      identityId: tokenData.identityId as unknown as IdentityId,
      refreshTokenHash: generateUUID(),
      expiresAt,
      deviceInfo: device.toDTO(),
    });

    try {
      await this.sessionRepository.save(session);
    } catch (error) {
      this.logger.warn('Failed to persist reconstructed session, keeping runtime-only session', {
        error,
        sessionId: tokenData.sessionId,
      });
    }

    return session;
  }

  /**
   * 启动自动刷新
   */
  private startAutoRefresh(): void {
    this.tokenManager.startAutoRefresh(async () => {
      const result = await this.refreshSession();
      return {
        ok: result.ok,
        accessToken: result.accessToken,
        expiresAt: result.expiresIn ? Date.now() + result.expiresIn * 1000 : undefined,
        error: result.error || undefined,
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
    this.activityTimer = setInterval(
      async () => {
        if (this.currentSession) {
          this.currentSession.touch();
          await this.sessionRepository.save(this.currentSession);
        }
      },
      5 * 60 * 1000,
    );
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
  identityRepository: IAuthIdentityRepository,
  logger?: ILogger,
): SessionManager {
  return SessionManager.getInstance(sessionRepository, identityRepository, logger);
}
