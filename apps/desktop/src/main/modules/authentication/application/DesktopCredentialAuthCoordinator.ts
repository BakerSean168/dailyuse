import type { ILogger } from '@dailyuse/utils';
import type {
  IAuthSessionRepository,
  IAuthIdentityRepository as IAuthCredentialRepository,
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
  type AuthResponseDTO,
  type EmailLoginCredentials,
  type RememberedDesktopAccountLoginReq,
} from '@dailyuse/contracts/authentication';
import {
  TokenManager,
  SessionManager,
  getNetworkStateManager,
} from '../infrastructure';
import { getWindowManager } from '../../../lifecycle/WindowManager';
import { registerDesktopAccount } from './registerDesktopAccount';
import type { RegisterApiResponse } from './AuthRemoteGateway';
import { AuthRemoteGateway } from './AuthRemoteGateway';
import { loginDesktopAccount } from './loginDesktopAccount';
import { DesktopAuthAccountProjectionService } from './DesktopAuthAccountProjectionService';
import { DesktopRememberedAccountService } from './DesktopRememberedAccountService';
import {
  getAccessTokenExpiresInSeconds,
  resolveCurrentIdentityId,
  buildOfflineAuthResponse,
} from './authCoordinatorHelpers';

export type LoginCredentials = EmailLoginCredentials;

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
}

/** Mutable auth state shared between coordinator and facade. */
export interface AuthState {
  authMode: AuthMode;
  runtimeState: AuthRuntimeState;
}

/**
 * Coordinates credential-based authentication: login, register, logout, guest mode.
 * Manages auth mode and runtime state transitions.
 */
export class DesktopCredentialAuthCoordinator {
  constructor(
    private readonly logger: ILogger,
    private readonly tokenManager: TokenManager,
    private readonly remoteGateway: AuthRemoteGateway,
    private readonly sessionManager: SessionManager,
    private readonly projectionService: DesktopAuthAccountProjectionService,
    private readonly rememberedAccountService: DesktopRememberedAccountService,
    private readonly credentialRepository: IAuthCredentialRepository | null,
    private readonly sessionRepository: IAuthSessionRepository | null,
    private readonly authState: AuthState,
  ) {}

  async login(credentials: LoginCredentials): Promise<IpcResult<AuthResponseDTO>> {
    this.logger.info('Login attempt', { email: credentials.email });
    return this.executeLogin(credentials);
  }

  async loginRememberedAccount(
    request: RememberedDesktopAccountLoginReq,
  ): Promise<IpcResult<AuthResponseDTO>> {
    const account = await this.rememberedAccountService.findRememberedAccount(request.identityId);
    if (!account) {
      return toIpcResult(
        fail({ code: 'REMEMBERED_ACCOUNT_NOT_FOUND', message: '未找到该记住的账号' }),
      );
    }

    const resolvedPassword = this.rememberedAccountService.decryptPassword(account);
    if (!resolvedPassword) {
      return toIpcResult(
        fail({ code: 'REMEMBERED_PASSWORD_UNAVAILABLE', message: '该账号没有可用的已保存密码' }),
      );
    }

    this.logger.info('Remembered account login attempt', {
      identityId: String(request.identityId),
      email: account.identifier,
    });

    return this.executeLogin({
      email: account.identifier,
      password: resolvedPassword,
      rememberPassword: request.rememberPassword ?? account.rememberPassword,
      autoLogin: request.autoLogin ?? account.autoLogin,
    });
  }

  private async executeLogin(credentials: LoginCredentials): Promise<IpcResult<AuthResponseDTO>> {
    try {
      const mainWindow = getWindowManager().getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        const currentIdentityId = resolveCurrentIdentityId(this.authState, this.sessionManager, this.tokenManager);
        const localConflict = await this.projectionService.checkActiveLocalConflict(
          credentials.email,
          currentIdentityId,
          this.credentialRepository,
        );
        if (localConflict) {
          return toIpcResult(fail(localConflict));
        }
      }

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
            if (!response.accessToken) return;

            const sessionId = response.session.id || crypto.randomUUID();
            const expiresIn = getAccessTokenExpiresInSeconds(response.session?.expiresAt);

            if (request.rememberPassword) {
              await this.sessionManager
                .saveOfflineCredentials(request.email, request.password, response.identity.id)
                .catch((err) => this.logger.warn('Failed to cache offline credentials', { error: err }));
            } else {
              await this.sessionManager
                .removeOfflineCredentials(request.email)
                .catch((err) => this.logger.warn('Failed to clear offline credentials', { error: err }));
            }

            await this.sessionManager.activateOnlineSession({
              identityId: response.identity.id,
              sessionId,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken || '',
              expiresIn,
            });

            await this.projectionService.ensureAccountProjection(
              String(response.identity.id),
              this.projectionService.extractIdentityEmail(response.identity) ?? request.email,
            );

            await this.rememberedAccountService.recordLogin({
              identityId: response.identity.id,
              identifier: request.email,
              nickname: this.projectionService.extractNickname(response.identity),
              avatarUrl: null,
              rememberPassword: request.rememberPassword ?? false,
              autoLogin: request.autoLogin ?? false,
              password: request.rememberPassword ? request.password : undefined,
            });
          },
        },
      );

      if (!remoteResult.ok && !remoteResult.error.shouldFallbackToOffline) {
        return toIpcResult(fail({ code: remoteResult.error.code, message: remoteResult.error.message }));
      }

      if (remoteResult.ok) {
        this.authState.authMode = AuthMode.ONLINE_USER;
        this.authState.runtimeState = AuthRuntimeState.AUTHENTICATED;
        return toIpcResult(ok({ ...remoteResult.response, authMode: AuthMode.ONLINE_USER }));
      }

      const offlineResponse = await this.sessionManager.loginOffline({
        identifier: credentials.email,
        password: credentials.password,
        rememberPassword: credentials.rememberPassword,
        autoLogin: credentials.autoLogin,
      });

      if (offlineResponse.ok && offlineResponse.identityId && offlineResponse.sessionId && offlineResponse.accessToken) {
        const offlineAuthResponse = await buildOfflineAuthResponse(
          offlineResponse.identityId,
          offlineResponse.sessionId,
          offlineResponse.accessToken,
          undefined,
          this.credentialRepository,
          this.sessionRepository,
        );
        this.authState.authMode = AuthMode.OFFLINE_USER;
        this.authState.runtimeState = AuthRuntimeState.AUTHENTICATED;
        return toIpcResult(ok({ ...offlineAuthResponse, authMode: AuthMode.OFFLINE_USER }));
      }

      return toIpcResult(fail({ code: 'LOGIN_FAILED', message: offlineResponse.error || '登录失败' }));
    } catch (error) {
      this.logger.error('Login failed', { error });
      return toIpcResult(
        fail({ code: 'LOGIN_ERROR', message: error instanceof Error ? error.message : '登录失败' }),
      );
    }
  }

  async register(request: RegisterRequest): Promise<IpcResult<AuthResponseDTO>> {
    const result = await registerDesktopAccount(request, {
      isOnline: () => getNetworkStateManager().isOnline(),
      remoteGateway: this.remoteGateway,
      logger: this.logger,
      onSuccess: async (data) => {
        await this.completeRegisterSuccess(data, request);
      },
    });

    if (result.ok) {
      return toIpcResult(ok(result.response));
    }
    return toIpcResult(fail(result.error));
  }

  async completeRegisterSuccess(
    data: RegisterApiResponse | AuthResponseDTO,
    request: RegisterRequest,
  ): Promise<void> {
    const registerLike = data as RegisterApiResponse & {
      user?: { id?: string };
      identityId?: string;
      sessionId?: string;
    };
    const identityId = data.identity?.id || registerLike.identityId || registerLike.user?.id || '';
    if (!data.accessToken || !identityId) return;

    const sessionId = data.session?.id || registerLike.sessionId || crypto.randomUUID();
    const expiresIn = getAccessTokenExpiresInSeconds(data.session?.expiresAt);
    this.authState.authMode = AuthMode.ONLINE_USER;
    this.authState.runtimeState = AuthRuntimeState.AUTHENTICATED;

    await this.sessionManager.activateOnlineSession({
      identityId,
      sessionId,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || '',
      expiresIn,
    });

    await this.sessionManager
      .saveOfflineCredentials(request.email, request.password, identityId)
      .catch((err) =>
        this.logger.warn('Failed to cache offline credentials after register', { error: err }),
      );

    await this.rememberedAccountService.recordLogin({
      identityId,
      identifier: request.email,
      nickname: request.username ?? null,
      avatarUrl: null,
      rememberPassword: true,
      autoLogin: false,
    });
  }

  async completeRemoteLoginSuccess(
    response: AuthResponseDTO,
    request: {
      email: string;
      password: string;
      rememberPassword?: boolean;
      autoLogin?: boolean;
    },
  ): Promise<void> {
    if (!response.accessToken) {
      throw new Error('Auth service is not initialized for profile login persistence');
    }

    const sessionId = response.session.id || crypto.randomUUID();
    const expiresIn = getAccessTokenExpiresInSeconds(response.session?.expiresAt);

    if (request.rememberPassword) {
      await this.sessionManager
        .saveOfflineCredentials(request.email, request.password, response.identity.id)
        .catch((err) => this.logger.warn('Failed to cache offline credentials', { error: err }));
    } else {
      await this.sessionManager
        .removeOfflineCredentials(request.email)
        .catch((err) => this.logger.warn('Failed to clear offline credentials', { error: err }));
    }

    await this.sessionManager.activateOnlineSession({
      identityId: response.identity.id,
      sessionId,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken || '',
      expiresIn,
    });

    await this.projectionService.ensureAccountProjection(
      String(response.identity.id),
      this.projectionService.extractIdentityEmail(response.identity) ?? request.email,
    );

    await this.rememberedAccountService.recordLogin({
      identityId: response.identity.id,
      identifier: request.email,
      nickname: this.projectionService.extractNickname(response.identity),
      avatarUrl: null,
      rememberPassword: request.rememberPassword ?? false,
      autoLogin: request.autoLogin ?? false,
      password: request.rememberPassword ? request.password : undefined,
    });

    this.authState.authMode = AuthMode.ONLINE_USER;
    this.authState.runtimeState = AuthRuntimeState.AUTHENTICATED;
  }

  async enterGuestMode(): Promise<IpcResult<{ identityId: string; mode: AuthMode; message: string }>> {
    this.logger.info('Entering guest mode');

    try {
      const guestId = await this.sessionManager.getOrCreateGuestIdentity();
      this.authState.authMode = AuthMode.GUEST;
      this.authState.runtimeState = AuthRuntimeState.AUTHENTICATED;

      this.projectionService.ensureAccountProjection(guestId, null).catch((err) =>
        this.logger.warn('Account projection failed in guest mode (non-blocking)', { error: err }),
      );

      this.logger.info('Guest mode activated', { identityId: guestId });
      return toIpcResult(ok({ identityId: guestId, mode: AuthMode.GUEST, message: '已进入访客模式' }));
    } catch (error) {
      this.logger.error('Failed to enter guest mode', { error });
      return toIpcResult(
        fail({ code: 'GUEST_MODE_ERROR', message: error instanceof Error ? error.message : '进入访客模式失败' }),
      );
    }
  }

  async logout(): Promise<IpcResult<void>> {
    this.logger.info('Logout');

    try {
      const result = await this.sessionManager.logout();
      this.authState.authMode = AuthMode.UNAUTHENTICATED;
      this.authState.runtimeState = AuthRuntimeState.UNAUTHENTICATED;

      if (result.ok) return toIpcResult(ok(undefined));
      return toIpcResult(fail({ code: 'LOGOUT_FAILED', message: result.error || '登出失败' }));
    } catch (error) {
      this.logger.error('Logout failed', { error });
      return toIpcResult(fail({ code: 'LOGOUT_ERROR', message: String(error) }));
    }
  }
}
