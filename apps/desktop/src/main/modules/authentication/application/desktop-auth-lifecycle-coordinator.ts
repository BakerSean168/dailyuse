import type { ILogger } from '@dailyuse/utils';
import type {
  IAuthSessionRepository,
  IAuthIdentityRepository as IAuthCredentialRepository,
  AuthSession,
} from '@dailyuse/authentication/domain-server';
import {
  type IpcResult,
  toIpcResult,
  ok,
  fail,
} from '@dailyuse/contracts/result';
import {
  AuthMode,
  AuthRuntimeState,
  ConnectionStatus,
  type AuthResponseDTO,
  type TokenStatus,
  type AutoLoginResult as ContractAutoLoginResult,
  type SessionRestoreResult as ContractSessionRestoreResult,
  type UserInfo,
  type SessionInfo,
  type AuthStatus,
  type TokenStorageData,
  type AuthBootstrapSnapshot,
} from '@dailyuse/contracts/authentication';
import {
  TokenManager,
  SessionManager,
  type SessionStatus,
  getNetworkStateManager,
} from '../infrastructure';
import { AuthRemoteGateway } from './auth-remote-gateway';
import { refreshDesktopSession } from './refresh-desktop-session';
import { DesktopAuthAccountProjectionService } from './desktop-auth-account-projection-service';
import { DesktopRememberedAccountService } from './desktop-remembered-account-service';
import type { AuthState } from './desktop-credential-auth-coordinator';
import {
  getAccessTokenExpiresInSeconds,
  resolveCurrentIdentityId,
  buildOfflineAuthResponse,
  buildFallbackIdentityClientDTO,
  toIdentityLookupId,
} from './auth-coordinator-helpers';

// ===== Extended Types =====

export interface AutoLoginResult extends ContractAutoLoginResult {
  session?: AuthSession;
}

export interface SessionRestoreResult extends ContractSessionRestoreResult {
  hasValidSession: boolean;
  session?: AuthSession;
}

/**
 * Coordinates auth lifecycle: initialize, autoLogin, refreshToken, getStatus, buildBootstrapSnapshot, cleanup.
 */
export class DesktopAuthLifecycleCoordinator {
  constructor(
    private readonly logger: ILogger,
    private readonly tokenManager: TokenManager,
    private readonly remoteGateway: AuthRemoteGateway,
    private readonly sessionManager: SessionManager | null,
    private readonly projectionService: DesktopAuthAccountProjectionService,
    private readonly rememberedAccountService: DesktopRememberedAccountService,
    private readonly credentialRepository: IAuthCredentialRepository | null,
    private readonly sessionRepository: IAuthSessionRepository | null,
    private readonly authState: AuthState,
    private isInitializedRef: { value: boolean },
  ) {}

  async initialize(): Promise<SessionRestoreResult> {
    if (this.isInitializedRef.value) {
      this.logger.warn('AuthDesktopApplicationService already initialized');
      return {
        success: true,
        hasValidSession: this.sessionManager?.getCurrentSession()?.isValid() ?? false,
        runtimeState: this.authState.runtimeState,
      };
    }

    this.logger.info('Initializing AuthDesktopApplicationService');

    if (!this.sessionManager) {
      this.logger.warn('SessionManager not available, running in minimal mode');
      this.isInitializedRef.value = true;
      this.authState.runtimeState = AuthRuntimeState.UNAUTHENTICATED;
      return { ok: true, hasValidSession: false, runtimeState: this.authState.runtimeState };
    }

    try {
      this.authState.runtimeState = AuthRuntimeState.RESTORING;
      const result = await this.sessionManager.initialize();

      if (result.ok && result.session) {
        const tokenData = await this.tokenManager.loadTokens();
        this.authState.authMode = this.resolveRestoredAuthMode(result.session.identityId, tokenData);
        this.authState.runtimeState = AuthRuntimeState.AUTHENTICATED;

        const credentialIdentity = await this.credentialRepository?.findById(
          toIdentityLookupId(result.session.identityId),
        );
        const restoredEmail = credentialIdentity
          ? this.projectionService.extractIdentityEmail(credentialIdentity.toClientDTO())
          : null;
        await this.projectionService.ensureAccountProjection(result.session.identityId, restoredEmail);
      } else {
        this.authState.authMode = AuthMode.UNAUTHENTICATED;
        this.authState.runtimeState = AuthRuntimeState.UNAUTHENTICATED;
      }

      this.isInitializedRef.value = true;
      this.logger.info('AuthDesktopApplicationService initialized', {
        hasSession: result.ok,
        identityId: result.identityId,
      });

      return {
        ok: true,
        hasValidSession: result.ok ?? false,
        runtimeState: this.authState.runtimeState,
        identityId: result.identityId,
        sessionId: result.session?.id,
        needsRefresh: result.needsRefresh,
        needsReLogin: result.needsReLogin,
      };
    } catch (error) {
      this.logger.error('Failed to initialize', { error });
      this.isInitializedRef.value = true;
      this.authState.authMode = AuthMode.UNAUTHENTICATED;
      this.authState.runtimeState = AuthRuntimeState.UNAUTHENTICATED;
      return {
        ok: false,
        hasValidSession: false,
        runtimeState: this.authState.runtimeState,
        error: String(error),
        needsReLogin: true,
      };
    }
  }

  async autoLogin(): Promise<AutoLoginResult> {
    this.logger.info('Auto login attempt');

    try {
      if (!this.sessionManager) {
        return { ok: false, authenticated: false, error: 'Service not initialized' };
      }

      const remembered = await this.rememberedAccountService.getAutoLoginAccount();
      if (!remembered) {
        return { ok: true, authenticated: false };
      }

      if (!this.isInitializedRef.value) {
        const initResult = await this.initialize();
        if (!initResult.ok) {
          return {
            ok: false,
            authenticated: false,
            error: initResult.error || 'Failed to initialize auth service',
          };
        }
      }

      const existingSession = this.sessionManager.getCurrentSession();
      if (existingSession?.isValid()) {
        return {
          ok: true,
          authenticated: true,
          identityId: existingSession.identityId,
          sessionId: existingSession.id,
        };
      }

      const result = await this.sessionManager.autoLogin();
      if (result.ok && result.session) {
        const tokenData = await this.tokenManager.loadTokens();
        this.authState.authMode = this.resolveRestoredAuthMode(result.session.identityId, tokenData);
        this.authState.runtimeState = AuthRuntimeState.AUTHENTICATED;
      } else {
        this.authState.authMode = AuthMode.UNAUTHENTICATED;
        this.authState.runtimeState = AuthRuntimeState.UNAUTHENTICATED;
      }

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

            await this.tokenManager.updateAccessToken(
              response.accessToken,
              getAccessTokenExpiresInSeconds(response.session?.expiresAt),
            );

            if (response.refreshToken) {
              await this.tokenManager.updateRefreshToken(response.refreshToken);
            }

            if (this.sessionManager) {
              await this.sessionManager.syncCurrentSessionExpiry(
                getAccessTokenExpiresInSeconds(response.session?.expiresAt) * 1000,
              );
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
          result = await buildOfflineAuthResponse(
            tokenData.identityId,
            tokenData.sessionId,
            tokenData.accessToken,
            tokenData.refreshToken,
            this.credentialRepository,
            this.sessionRepository,
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
        this.authState.authMode = remoteResult.ok ? AuthMode.ONLINE_USER : AuthMode.OFFLINE_USER;
        this.authState.runtimeState = AuthRuntimeState.AUTHENTICATED;
        return toIpcResult(ok(result));
      }
      return toIpcResult(fail({ code: 'REFRESH_FAILED', message: '刷新失败' }));
    } catch (error) {
      this.logger.error('Refresh token failed', { error });
      return toIpcResult(fail({ code: 'REFRESH_ERROR', message: String(error) }));
    }
  }

  async getStatus(): Promise<AuthStatus> {
    this.logger.debug('Get auth status');

    await this.sessionManager?.ensureCurrentSession();
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
      mode: this.authState.authMode,
      runtimeState: this.authState.runtimeState,
      connectionStatus,
      user,
      session: sessionInfo,
      tokenStatus,
      canSync:
        this.authState.authMode === AuthMode.ONLINE_USER && connectionStatus === ConnectionStatus.ONLINE,
      needsReauth: tokenStatus.isRefreshTokenExpired,
    };
  }

  async buildBootstrapSnapshot(): Promise<AuthBootstrapSnapshot> {
    await this.sessionManager?.ensureCurrentSession();
    const status = await this.getStatus();
    const identityId = resolveCurrentIdentityId(
      this.authState,
      this.sessionManager,
      this.tokenManager,
    );
    const session = this.sessionManager?.getCurrentSession() ?? null;
    const identity = identityId
      ? await this.credentialRepository?.findById(toIdentityLookupId(identityId))
      : null;

    const currentUser = status.authenticated
      ? {
          identity: identity
            ? identity.toClientDTO()
            : buildFallbackIdentityClientDTO(identityId ?? 'unknown'),
          session: session ? session.toClientDTO(true) : null,
        }
      : null;

    return { status, currentUser };
  }

  async verifyToken(token: string): Promise<{ valid: boolean; error?: string }> {
    this.logger.debug('Verify token');

    try {
      const currentToken = await this.tokenManager.getAccessToken();
      if (!currentToken) {
        return { valid: false, error: 'No token available' };
      }
      return { valid: token === currentToken };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  }

  async getTokenStatus(): Promise<TokenStatus> {
    return await this.tokenManager.getStatus();
  }

  async getSessionStatus(): Promise<SessionStatus | null> {
    if (!this.sessionManager) {
      return null;
    }
    return await this.sessionManager.getStatus();
  }

  async cleanupExpiredSessions(): Promise<number> {
    if (!this.sessionManager) {
      return 0;
    }
    return await this.sessionManager.cleanupExpiredSessions();
  }

  cleanup(): void {
    this.logger.info('Cleaning up AuthDesktopApplicationService');
    this.sessionManager?.cleanup();
    this.isInitializedRef.value = false;
  }

  // ===== Private Helpers =====

  private resolveRestoredAuthMode(
    _identityId: string,
    tokenData: TokenStorageData | null,
  ): AuthMode {
    if (this.projectionService.isGuestTokenData(tokenData)) {
      return AuthMode.GUEST;
    }

    if (this.projectionService.isLocalOnlyTokenData(tokenData)) {
      return AuthMode.OFFLINE_USER;
    }

    return tokenData ? AuthMode.ONLINE_USER : AuthMode.OFFLINE_USER;
  }
}
