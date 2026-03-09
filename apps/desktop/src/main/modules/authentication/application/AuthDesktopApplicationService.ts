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
 *
 * 响应格式说明：
 * - 所有方法返回 IpcResult<T> 格式（使用 ok/fail）
 * - 成功: { ok: true, data: T }
 * - 失败: { ok: false, error: { code, message } }
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import type {
  IAuthSessionRepository,
  IAuthIdentityRepository as IAuthCredentialRepository,
} from '@dailyuse/authentication/domain-server';
import type { AuthSession } from '@dailyuse/authentication/domain-server';
import {
  // Result Pattern - 统一响应格式
  type IpcResult,
  toIpcResult,
  ok,
  fail,
} from '@dailyuse/contracts/result';
import {
  AuthMode,
  ConnectionStatus,
  type AuthResponseDTO,
  type AuthIdentityClientDTO,
  type AuthSessionClientDTO,
  type AuthSessionId,
  type TokenStatus,
  type AutoLoginResult as ContractAutoLoginResult,
  type SessionRestoreResult as ContractSessionRestoreResult,
  type UserInfo,
  type SessionInfo,
  type TwoFactorStatus,
  type ApiKeyInfo,
  type AuthStatus,
  type EmailLoginCredentials,
  type DeviceInfoUI,
} from '@dailyuse/contracts/authentication';
import {
  TokenManager,
  getTokenManager,
  SessionManager,
  createSessionManager,
  type SessionStatus,
  getRememberedAccountsService,
  type RememberedAccountRecord,
} from '../infrastructure';
import {
  connectPowerSync,
  disconnectPowerSync,
  openPowerSyncLocalOnly,
} from '../../../database/powersync';
import { getNetworkStateManager } from '../infrastructure';
import { registerDesktopAccount } from './registerDesktopAccount';
import { AuthRemoteGateway, type RegisterApiResponse } from './AuthRemoteGateway';
import { loginDesktopAccount } from './loginDesktopAccount';
import { refreshDesktopSession } from './refreshDesktopSession';

// Re-export from contracts for convenience
export type {
  IpcResult,
  UserInfo,
  SessionInfo,
  TwoFactorStatus,
  ApiKeyInfo,
  AuthStatus,
  EmailLoginCredentials,
};
export type { DeviceInfoUI } from '@dailyuse/contracts/authentication';
export { AuthMode, ConnectionStatus, toIpcResult, ok, fail };

// Alias for backward compatibility
export type LoginCredentials = EmailLoginCredentials;

// ===== Extended Types (Desktop specific) =====

/**
 * 注册请求（简化版，Desktop 专用）
 */
export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

/**
 * 自动登录结果（扩展 Contract 类型，包含领域对象）
 */
export interface AutoLoginResult extends ContractAutoLoginResult {
  session?: AuthSession;
}

/**
 * 会话恢复结果（扩展 Contract 类型）
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
  private readonly remoteGateway: AuthRemoteGateway;
  private readonly rememberedAccounts = getRememberedAccountsService();
  private sessionManager: SessionManager | null = null;

  // 依赖注入的 Repositories（惰性初始化）
  private sessionRepository: IAuthSessionRepository | null = null;
  private credentialRepository: IAuthCredentialRepository | null = null;

  // 当前认证模式
  private authMode: AuthMode = AuthMode.UNAUTHENTICATED;
  private isInitialized = false;

  constructor(logger?: ILogger) {
    this.logger = logger || createLogger('AuthDesktopAppService');
    this.tokenManager = getTokenManager(this.logger);
    this.remoteGateway = new AuthRemoteGateway();
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
   * 注入离线认证依赖（Phase 2）
   * 将 IAuthIdentityRepository + IPasswordHasher 传递给 SessionManager
   */
  setOfflineAuthDependencies(
    identityRepository: import('@dailyuse/authentication/domain-server').IAuthIdentityRepository,
    passwordHasher: import('@dailyuse/authentication/domain-shared').IPasswordHasher,
  ): void {
    if (this.sessionManager) {
      this.sessionManager.setOfflineAuthDependencies(identityRepository, passwordHasher);
    } else {
      this.logger.warn('SessionManager not initialized, cannot set offline auth dependencies');
    }
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
      return { ok: true, hasValidSession: false };
    }

    try {
      const result = await this.sessionManager.initialize();

      this.isInitialized = true;
      this.logger.info('AuthDesktopApplicationService initialized', {
        hasSession: result.ok,
        identityId: result.identityId,
      });

      return {
        ok: true,
        hasValidSession: result.ok ?? false,
        identityId: result.identityId,
        sessionId: result.session?.id,
        needsRefresh: result.needsRefresh,
        needsReLogin: result.needsReLogin,
      };
    } catch (error) {
      this.logger.error('Failed to initialize', { error });
      this.isInitialized = true;
      return {
        ok: false,
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
   * @returns IpcResult<LoginData> - 统一的响应格式
   */
  async login(credentials: LoginCredentials): Promise<IpcResult<AuthResponseDTO>> {
    this.logger.info('Login attempt', { email: credentials.email });

    if (!this.sessionManager) {
      return toIpcResult(fail({ code: 'NOT_INITIALIZED', message: '认证服务未初始化' }));
    }

    try {
      const networkManager = getNetworkStateManager();
      const remoteResult = await loginDesktopAccount(
        {
          email: credentials.email,
          password: credentials.password,
          rememberPassword: credentials.rememberPassword,
          autoLogin: credentials.autoLogin,
        },
        {
          isOnline: () => networkManager.isOnline(),
          remoteGateway: this.remoteGateway,
          logger: this.logger,
          onSuccess: async (response, request) => {
            if (!response.accessToken) {
              return;
            }

            await this.tokenManager.saveTokens({
              accessToken: response.accessToken,
              refreshToken: response.refreshToken || '',
              accessTokenExpiresIn: 3600,
              identityId: response.identity.id,
              sessionId: response.session.id || crypto.randomUUID(),
            });

            if (this.sessionManager) {
              if (request.rememberPassword) {
                await this.sessionManager
                  .saveOfflineCredentials(request.email, request.password, response.identity.id)
                  .catch((err) =>
                    this.logger.warn('Failed to cache offline credentials', { error: err }),
                  );
              } else {
                await this.sessionManager
                  .removeOfflineCredentials(request.email)
                  .catch((err) =>
                    this.logger.warn('Failed to clear offline credentials', { error: err }),
                  );
              }
            }

            await this.rememberedAccounts.recordLogin({
              identityId: response.identity.id,
              identifier: request.email,
              nickname: this.extractNickname(response.identity),
              avatarUrl: null,
              rememberPassword: request.rememberPassword ?? false,
              autoLogin: request.autoLogin ?? false,
            });
          },
        },
      );

      if (!remoteResult.ok && !remoteResult.error.shouldFallbackToOffline) {
        return toIpcResult(
          fail({
            code: 'LOGIN_FAILED',
            message: remoteResult.error.message,
          }),
        );
      }

      let finalResult: {
        ok: boolean;
        response?: AuthResponseDTO & { authMode?: AuthMode; ok?: boolean };
        error?: string;
      };

      if (remoteResult.ok) {
        finalResult = {
          ok: true,
          response: {
            ...remoteResult.response,
            authMode: AuthMode.ONLINE_USER,
          },
        };
      } else {
        const offlineResponse = await this.sessionManager.login({
          identifier: credentials.email,
          password: credentials.password,
          rememberPassword: credentials.rememberPassword,
          autoLogin: credentials.autoLogin,
        });

        const offlineAuthResponse =
          offlineResponse.ok &&
          offlineResponse.identityId &&
          offlineResponse.sessionId &&
          offlineResponse.accessToken
            ? await this.buildOfflineAuthResponse(
                offlineResponse.identityId,
                offlineResponse.sessionId,
                offlineResponse.accessToken,
              )
            : undefined;

        finalResult = {
          ok: offlineResponse.ok,
          response: offlineAuthResponse
            ? { ...offlineAuthResponse, authMode: AuthMode.OFFLINE_USER, ok: true }
            : undefined,
          error: offlineResponse.error,
        };
      }

      if (finalResult.ok && finalResult.response) {
        this.authMode = finalResult.response.authMode ?? AuthMode.ONLINE_USER;
        this.logger.info('Login successful', {
          identityId: finalResult.response.identity.id,
          authMode: this.authMode,
        });

        // Connect PowerSync based on auth mode
        if (this.authMode === AuthMode.ONLINE_USER) {
          connectPowerSync().catch((err) =>
            this.logger.error('PowerSync connect failed after login', { error: err }),
          );
        } else if (this.authMode === AuthMode.OFFLINE_USER) {
          openPowerSyncLocalOnly().catch((err) =>
            this.logger.error('PowerSync local-only open failed after offline login', {
              error: err,
            }),
          );
        }

        return toIpcResult(ok(finalResult.response));
      }

      return toIpcResult(
        fail({
          code: 'LOGIN_FAILED',
          message: finalResult.error || '登录失败',
        }),
      );
    } catch (error) {
      this.logger.error('Login failed', { error });
      return toIpcResult(
        fail({
          code: 'LOGIN_ERROR',
          message: error instanceof Error ? error.message : '登录失败',
        }),
      );
    }
  }

  private async buildOfflineAuthResponse(
    identityId: string,
    sessionId: string,
    accessToken: string,
    refreshToken?: string,
  ): Promise<AuthResponseDTO> {
    const identity = await this.credentialRepository?.findById(identityId as any);
    const session = await this.sessionRepository?.findById(sessionId as AuthSessionId);

    const identityDto: AuthIdentityClientDTO = identity
      ? identity.toClientDTO()
      : {
          id: identityId as any,
          status: 'Active' as any,
          failedLoginAttempts: 0,
          lastFailedAttempt: null,
          lockedUntil: null,
          identifiers: [],
          credentials: [],
          hasPassword: true,
          hasEmail: false,
          hasPhone: false,
          hasOAuth: false,
          version: 1,
          createdAt: Date.now() as any,
          updatedAt: Date.now() as any,
          deletedAt: null,
        };

    const sessionDto: AuthSessionClientDTO = session
      ? session.toClientDTO(true)
      : {
          id: sessionId as any,
          identityId: identityId as any,
          deviceInfo: {
            deviceId: 'desktop-offline',
            deviceFingerprint: 'offline',
            deviceType: 'Desktop' as any,
            deviceName: 'Desktop Offline Session',
            os: null,
            osVersion: null,
            browser: null,
            appVersion: null,
            ipAddress: null,
            userAgent: null,
            location: null,
            firstSeenAt: Date.now(),
            lastSeenAt: Date.now(),
          },
          isCurrentSession: true,
          version: 1,
          createdAt: Date.now() as any,
          updatedAt: Date.now() as any,
          expiresAt: (Date.now() + 3600_000) as any,
          lastActiveAt: Date.now() as any,
          deletedAt: null,
        };

    return {
      accessToken,
      refreshToken,
      identity: identityDto,
      session: sessionDto,
    };
  }

  /**
   * 注册
   * @description 在线模式注册新账户
   * @returns IpcResult<RegisterData> - 统一的响应格式
   */
  async register(request: RegisterRequest): Promise<IpcResult<AuthResponseDTO>> {
    const result = await registerDesktopAccount(request, {
      isOnline: () => getNetworkStateManager().isOnline(),
      remoteGateway: this.remoteGateway,
      logger: this.logger,
      onSuccess: async (data) => {
        await this.handleRegisterSuccess(data, request);
      },
    });

    if (result.ok) {
      return toIpcResult(ok(result.response));
    }

    return toIpcResult(fail(result.error));
  }

  private async handleRegisterSuccess(
    data: RegisterApiResponse,
    request: RegisterRequest,
  ): Promise<void> {
    const identityId = data.identity?.id || data.identityId || data.user?.id || '';

    if (!data.accessToken || !identityId) {
      return;
    }

    await this.tokenManager.saveTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || '',
      accessTokenExpiresIn: data.expiresIn || 3600,
      identityId,
      sessionId: data.session?.id || data.sessionId || crypto.randomUUID(),
    });
    this.authMode = AuthMode.ONLINE_USER;

    if (!this.sessionManager) {
      return;
    }

    await this.sessionManager
      .saveOfflineCredentials(request.email, request.password, identityId)
      .catch((err) =>
        this.logger.warn('Failed to cache offline credentials after register', {
          error: err,
        }),
      );

    await this.rememberedAccounts.recordLogin({
      identityId,
      identifier: request.email,
      nickname: request.username ?? null,
      avatarUrl: null,
      rememberPassword: true,
      autoLogin: false,
    });
  }

  /**
   * 进入访客模式
   * @description 使用持久化的本地访客身份，无需网络连接
   * @returns IpcResult<GuestModeData> - 统一的响应格式
   */
  async enterGuestMode(): Promise<
    IpcResult<{ identityId: string; mode: AuthMode; message: string }>
  > {
    this.logger.info('Entering guest mode');

    try {
      if (!this.sessionManager) {
        return toIpcResult(fail({ code: 'NOT_INITIALIZED', message: '认证服务未初始化' }));
      }

      const guestId = await this.sessionManager.getOrCreateGuestIdentity();
      this.authMode = AuthMode.GUEST;

      // Open local-only PowerSync for guest data
      openPowerSyncLocalOnly().catch((err) =>
        this.logger.error('PowerSync local-only open failed in guest mode', { error: err }),
      );

      this.logger.info('Guest mode activated', { identityId: guestId });

      return toIpcResult(
        ok({
          identityId: guestId,
          mode: AuthMode.GUEST,
          message: '已进入访客模式',
        }),
      );
    } catch (error) {
      this.logger.error('Failed to enter guest mode', { error });
      return toIpcResult(
        fail({
          code: 'GUEST_MODE_ERROR',
          message: error instanceof Error ? error.message : '进入访客模式失败',
        }),
      );
    }
  }

  /**
   * @deprecated Use enterGuestMode() instead
   */
  async enterOfflineMode(): Promise<
    IpcResult<{ identityId: string; mode: string; message: string }>
  > {
    return this.enterGuestMode();
  }

  /**
   * 登出
   * @returns IpcResult<void> - 统一的响应格式
   */
  async logout(): Promise<IpcResult<void>> {
    this.logger.info('Logout');

    if (!this.sessionManager) {
      // 至少清除 Token
      await this.tokenManager.clearTokens();
      // Disconnect PowerSync and wipe local sync data
      await disconnectPowerSync().catch((err) =>
        this.logger.error('PowerSync disconnect failed during logout', { error: err }),
      );
      return toIpcResult(ok(undefined));
    }

    try {
      const result = await this.sessionManager.logout();
      this.authMode = AuthMode.UNAUTHENTICATED;

      // Disconnect PowerSync and wipe local sync data regardless of logout result
      await disconnectPowerSync().catch((err) =>
        this.logger.error('PowerSync disconnect failed during logout', { error: err }),
      );

      if (result.ok) {
        return toIpcResult(ok(undefined));
      }
      return toIpcResult(fail({ code: 'LOGOUT_FAILED', message: result.error || '登出失败' }));
    } catch (error) {
      this.logger.error('Logout failed', { error });
      return toIpcResult(fail({ code: 'LOGOUT_ERROR', message: String(error) }));
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
      return { ok: false, authenticated: false, error: 'Service not initialized' };
    }

    try {
      const remembered = await this.rememberedAccounts.getAutoLoginAccount();
      if (!remembered) {
        return { ok: true, authenticated: false };
      }

      const result = await this.sessionManager.autoLogin();

      return {
        ok: result.ok,
        authenticated: result.ok,
        identityId: result.identityId,
        sessionId: result.session?.id,
        error: result.error,
      };
    } catch (error) {
      this.logger.error('Auto login failed', { error });
      return { ok: false, authenticated: false, error: String(error) };
    }
  }

  /**
   * 刷新令牌
   * @returns IpcResult<RefreshData> - 统一的响应格式
   */
  async refreshToken(): Promise<IpcResult<AuthResponseDTO>> {
    this.logger.info('Refresh token');

    if (!this.sessionManager) {
      return toIpcResult(fail({ code: 'NOT_INITIALIZED', message: '服务未初始化' }));
    }

    try {
      const tokenData = await this.tokenManager.loadTokens();
      if (!tokenData) {
        return toIpcResult(fail({ code: 'REFRESH_FAILED', message: '没有可刷新的会话令牌' }));
      }

      const remoteResult = await refreshDesktopSession(
        {
          refreshToken: tokenData.refreshToken,
          sessionId: tokenData.sessionId,
        },
        {
          isOnline: () => getNetworkStateManager().isOnline(),
          remoteGateway: this.remoteGateway,
          logger: this.logger,
          onSuccess: async (response) => {
            if (!response.accessToken) {
              return;
            }

            await this.tokenManager.updateAccessToken(response.accessToken, 3600);

            if (response.refreshToken) {
              await this.tokenManager.updateRefreshToken(response.refreshToken);
            }
          },
        },
      );

      let result: AuthResponseDTO | null = null;
      if (remoteResult.ok) {
        result = remoteResult.response;
      } else if (remoteResult.error.shouldFallbackToOffline) {
        const offlineResult = await this.sessionManager.refreshSession();
        if (
          offlineResult.ok &&
          tokenData.identityId &&
          tokenData.sessionId &&
          tokenData.accessToken
        ) {
          result = await this.buildOfflineAuthResponse(
            tokenData.identityId,
            tokenData.sessionId,
            tokenData.accessToken,
            tokenData.refreshToken,
          );
        } else {
          return toIpcResult(
            fail({ code: 'REFRESH_FAILED', message: offlineResult.error || '刷新失败' }),
          );
        }
      } else {
        return toIpcResult(
          fail({
            code: 'REFRESH_FAILED',
            message: remoteResult.error.message,
          }),
        );
      }

      if (result) {
        return toIpcResult(ok(result));
      }
      return toIpcResult(fail({ code: 'REFRESH_FAILED', message: '刷新失败' }));
    } catch (error) {
      this.logger.error('Refresh token failed', { error });
      return toIpcResult(fail({ code: 'REFRESH_ERROR', message: String(error) }));
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
    const networkManager = getNetworkStateManager();
    const connectionStatus: ConnectionStatus = networkManager.isOnline()
      ? ConnectionStatus.ONLINE
      : ConnectionStatus.OFFLINE;

    const authenticated = session?.isValid() ?? false;
    const user: UserInfo | null = session
      ? {
          id: session.identityId,
        }
      : null;

    const sessionInfo: SessionInfo | null = session
      ? {
          id: session.id,
          deviceName: session.deviceInfo?.deviceName ?? session.deviceInfo?.deviceId ?? 'Unknown',
          deviceType: session.deviceInfo?.deviceType ?? 'DESKTOP',
          ipAddress: session.deviceInfo?.ipAddress ?? '',
          createdAt: new Date(session.createdAt).toISOString(),
          lastActiveAt: new Date(session.lastActiveAt).toISOString(),
          expiresAt: new Date(session.expiresAt).toISOString(),
          isCurrentSession: true,
        }
      : null;

    return {
      authenticated,
      mode: this.authMode,
      connectionStatus,
      user,
      session: sessionInfo,
      tokenStatus,
      canSync:
        this.authMode === AuthMode.ONLINE_USER && connectionStatus === ConnectionStatus.ONLINE,
      needsReauth: tokenStatus.isRefreshTokenExpired,
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
  async enable2FA(method: string): Promise<IpcResult<{ qrCodeUrl?: string; secret?: string }>> {
    this.logger.debug('Enable 2FA', { method });

    if (this.authMode !== AuthMode.ONLINE_USER) {
      return toIpcResult(fail({ code: 'ONLINE_REQUIRED', message: '2FA 需要在线模式' }));
    }

    // TODO: 实现在线 2FA
    return toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: '2FA 功能尚未实现' }));
  }

  /**
   * 禁用双因素认证
   */
  async disable2FA(): Promise<IpcResult<void>> {
    this.logger.debug('Disable 2FA');
    return toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: '2FA 功能尚未实现' }));
  }

  /**
   * 验证双因素认证
   */
  async verify2FA(code: string): Promise<IpcResult<void>> {
    this.logger.debug('Verify 2FA');
    void code;
    return toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: '2FA 功能尚未实现' }));
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
  async createApiKey(request: {
    name: string;
    scopes?: string[];
  }): Promise<{ id: string; key: string } | null> {
    this.logger.debug('Create API key', { name: request.name });

    if (this.authMode !== AuthMode.ONLINE_USER) {
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
  async revokeApiKey(keyId: string): Promise<IpcResult<void>> {
    this.logger.debug('Revoke API key', { keyId });
    return toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: 'API Key 功能尚未实现' }));
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

      const sessions = await this.sessionRepository.findByIdentityId(currentSession.identityId);
      const sessionInfos: SessionInfo[] = sessions.map((s: AuthSession) => ({
        id: s.id,
        deviceName: s.deviceInfo?.deviceName ?? s.deviceInfo?.deviceId ?? 'Unknown',
        deviceType: s.deviceInfo?.deviceType ?? 'UNKNOWN',
        ipAddress: s.deviceInfo?.ipAddress ?? '',
        createdAt: new Date(s.createdAt).toISOString(),
        lastActiveAt: new Date(s.lastActiveAt).toISOString(),
        expiresAt: new Date(s.expiresAt).toISOString(),
        isCurrentSession: s.id === currentSession.id,
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
      id: session.id,
      deviceName: session.deviceInfo?.deviceName ?? session.deviceInfo?.deviceId ?? 'Unknown',
      deviceType: session.deviceInfo?.deviceType ?? 'DESKTOP',
      ipAddress: session.deviceInfo?.ipAddress ?? '',
      createdAt: new Date(session.createdAt).toISOString(),
      lastActiveAt: new Date(session.lastActiveAt).toISOString(),
      expiresAt: new Date(session.expiresAt).toISOString(),
      isCurrentSession: true,
    };
  }

  getCurrentIdentityId(): string | null {
    return this.sessionManager?.getCurrentSession()?.identityId ?? null;
  }

  getCurrentSessionId(): string | null {
    return this.sessionManager?.getCurrentSession()?.id ?? null;
  }

  getCurrentRequestContext(): { identityId: string; deviceId: string } | null {
    const session = this.sessionManager?.getCurrentSession();
    if (!session) {
      return null;
    }

    return {
      identityId: session.identityId,
      deviceId: session.deviceInfo?.deviceId ?? 'desktop-app',
    };
  }

  async getRememberedAccounts(): Promise<RememberedAccountRecord[]> {
    return this.rememberedAccounts.list();
  }

  async removeRememberedAccount(identityId: string): Promise<IpcResult<void>> {
    try {
      await this.rememberedAccounts.remove(identityId);
      return toIpcResult(ok(undefined));
    } catch (error) {
      return toIpcResult(
        fail({ code: 'REMEMBERED_ACCOUNT_REMOVE_FAILED', message: String(error) }),
      );
    }
  }

  private extractNickname(identity: AuthIdentityClientDTO): string | null {
    const emailIdentifier = identity.identifiers.find(
      (
        identifier,
      ): identifier is Extract<AuthIdentityClientDTO['identifiers'][number], { type: 'Email' }> =>
        identifier.type === 'Email',
    );

    return emailIdentifier?.value?.split('@')[0] || null;
  }

  /**
   * 撤销会话
   */
  async revokeSession(sessionId: string): Promise<IpcResult<void>> {
    this.logger.debug('Revoke session', { sessionId });

    if (!this.sessionRepository) {
      return toIpcResult(fail({ code: 'NOT_INITIALIZED', message: '服务未初始化' }));
    }

    try {
      const session = await this.sessionRepository.findById(sessionId as AuthSessionId);
      if (!session) {
        return toIpcResult(fail({ code: 'NOT_FOUND', message: '会话不存在' }));
      }

      // 不能撤销当前会话
      const currentSession = this.sessionManager?.getCurrentSession();
      if (currentSession && session.id === currentSession.id) {
        return toIpcResult(
          fail({ code: 'INVALID_OPERATION', message: '无法撤销当前会话，请使用登出' }),
        );
      }

      session.revoke();
      await this.sessionRepository.save(session);

      this.logger.info('Session revoked', { sessionId });
      return toIpcResult(ok(undefined));
    } catch (error) {
      this.logger.error('Failed to revoke session', { error });
      return toIpcResult(fail({ code: 'REVOKE_ERROR', message: String(error) }));
    }
  }

  /**
   * 撤销所有会话
   */
  async revokeAllSessions(): Promise<{ ok: boolean; count: number }> {
    this.logger.debug('Revoke all sessions');

    if (!this.sessionManager) {
      return { ok: false, count: 0 };
    }

    try {
      const currentSession = this.sessionManager.getCurrentSession();
      if (!currentSession) {
        return { ok: true, count: 0 };
      }

      const count = await this.sessionManager.cleanupOtherSessions(currentSession.identityId);
      return { ok: true, count };
    } catch (error) {
      this.logger.error('Failed to revoke all sessions', { error });
      return { ok: false, count: 0 };
    }
  }

  // ============================================
  // Devices Methods
  // ============================================

  /**
   * 列出设备
   */
  async listDevices(): Promise<{ devices: DeviceInfoUI[]; total: number }> {
    this.logger.debug('List devices');

    const deviceInfo = this.sessionManager?.getDeviceInfo();
    if (!deviceInfo) {
      return { devices: [], total: 0 };
    }

    const currentDevice: DeviceInfoUI = {
      id: deviceInfo.deviceId,
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
  async getCurrentDevice(): Promise<DeviceInfoUI> {
    this.logger.debug('Get current device');

    const deviceInfo = this.sessionManager?.getDeviceInfo();
    if (!deviceInfo) {
      return {
        id: 'unknown',
        name: 'Desktop App',
        type: 'DESKTOP',
      };
    }

    return {
      id: deviceInfo.deviceId,
      name: deviceInfo.deviceName ?? 'Desktop App',
      type: deviceInfo.deviceType,
      os: deviceInfo.os ?? undefined,
      fingerprint: deviceInfo.deviceFingerprint ?? undefined,
    };
  }

  /**
   * 撤销设备
   */
  async revokeDevice(deviceId: string): Promise<IpcResult<void>> {
    this.logger.debug('Revoke device', { deviceId });

    const currentDevice = this.sessionManager?.getDeviceInfo();
    if (currentDevice && deviceId === currentDevice.deviceId) {
      return toIpcResult(fail({ code: 'INVALID_OPERATION', message: '无法撤销当前设备' }));
    }

    // TODO: 实现跨设备撤销
    return toIpcResult(fail({ code: 'NOT_IMPLEMENTED', message: '跨设备撤销尚未实现' }));
  }

  /**
   * 重命名设备
   */
  async renameDevice(deviceId: string, name: string): Promise<IpcResult<void>> {
    this.logger.debug('Rename device', { deviceId, name });

    // TODO: 持久化设备名称
    return toIpcResult(ok(undefined));
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
