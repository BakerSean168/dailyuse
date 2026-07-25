/**
 * LoginOrchestrator — handles login/logout flows and online session creation.
 *
 * Extracted from SessionManager to keep the orchestrator thin.
 */

import { createLogger } from '@dailyuse/utils/logger';
import type { ILogger } from '@dailyuse/utils/logger';
import { generateUUID } from '@dailyuse/utils/shared';
import { AuthSession } from '@dailyuse/authentication/electron';
import type { IAuthSessionRepository, IAuthIdentityRepository } from '@dailyuse/authentication/electron';
import type { AuthSessionId } from '@dailyuse/contracts/authentication';
import type { IPasswordHasher } from '@dailyuse/authentication/electron';
import { DeviceInfo } from '@dailyuse/authentication/electron';
import {
  AuthMode,
  type LoginRequest,
  type DeviceInfoClientDTO,
  type OfflineLoginResponse,
} from '@dailyuse/contracts/authentication';
import { TokenManager } from './token-manager';
import type { OfflineAuthHelper } from './offline-auth-helper';
// Residual 925: OfflineLoginResponse from contracts sole body (no session-types alias).
import { toIdentityId, toDeviceInfoDTO, toErrorLog, LOCAL_ACCESS_TOKEN } from './session-types';

// ============ Dependencies ============

/** Dependencies required by the login orchestrator. */
export interface LoginOrchestratorDeps {
  getTokenManager(): TokenManager;
  readonly sessionRepository: IAuthSessionRepository;
  readonly offlineAuthHelper: OfflineAuthHelper;
  getDeviceInfo(): DeviceInfoClientDTO;
  setCurrentSession(session: AuthSession | null): void;
  startCurrentSessionLifecycle(): void;
  stopAutoRefresh(): void;
  stopActivityTracking(): void;
}

// ============ LoginOrchestrator ============

export class LoginOrchestrator {
  private readonly logger: ILogger;
  private readonly deps: LoginOrchestratorDeps;

  constructor(deps: LoginOrchestratorDeps, logger?: ILogger) {
    this.deps = deps;
    this.logger = logger || createLogger('LoginOrchestrator');
  }

  /** Login using locally cached credentials only. */
  async loginOffline(request: LoginRequest): Promise<OfflineLoginResponse> {
    this.logger.info('Offline login attempt', { identifier: request.identifier });

    try {
      return await this.localLogin(request);
    } catch (error) {
      this.logger.error('Offline login failed', { error });
      return { ok: false, error: String(error) };
    }
  }

  /**
   * Local login (offline password verification).
   *
   * Verifies the password against local AuthIdentity + Argon2,
   * creates a local session, and returns OFFLINE_USER mode.
   */
  private async localLogin(request: LoginRequest): Promise<OfflineLoginResponse> {
    this.logger.info('Attempting local login', { identifier: request.identifier });
    const { offlineAuthHelper, sessionRepository } = this.deps;
    const tokenManager = this.deps.getTokenManager();

    // Verify password against locally cached credentials
    const verification = await offlineAuthHelper.verifyCredentials(
      request.identifier,
      request.password,
    );

    if (!verification.ok) {
      const errorMessages: Record<string, string> = {
        NO_LOCAL_CREDENTIALS: 'Initial online login required to cache credentials',
        INVALID_PASSWORD: 'Invalid password',
        ACCOUNT_LOCKED: 'Account is locked, please try again later',
        OFFLINE_AUTH_UNAVAILABLE: 'Offline authentication service unavailable',
        OFFLINE_STORAGE_ERROR: 'Internal error, please contact the developer',
      };
      return {
        ok: false,
        error: errorMessages[verification.error!] ?? verification.error,
        authMode: AuthMode.UNAUTHENTICATED,
      };
    }

    // Create local session with real identity ID
    const deviceInfo = this.deps.getDeviceInfo();
    const device = DeviceInfo.create(toDeviceInfoDTO(deviceInfo));

    const session = AuthSession.create({
      id: generateUUID() as unknown as AuthSessionId,
      identityId: toIdentityId(verification.identityId!),
      refreshTokenHash: generateUUID(),
      expiresAt: Date.now() + 3600 * 1000,
      deviceInfo: device.toDTO(),
    });

    await sessionRepository.save(session);
    this.deps.setCurrentSession(session);

    await tokenManager.saveTokens({
      accessToken: LOCAL_ACCESS_TOKEN,
      refreshToken: LOCAL_ACCESS_TOKEN,
      accessTokenExpiresIn: 3600,
      refreshTokenExpiresIn: 30 * 24 * 3600,
      identityId: toIdentityId(session.identityId),
      sessionId: session.id,
    });

    this.deps.startCurrentSessionLifecycle();

    this.logger.info('Local login successful', {
      identityId: session.identityId,
      authMode: AuthMode.OFFLINE_USER,
    });

    return {
      ok: true,
      sessionId: session.id,
      accessToken: LOCAL_ACCESS_TOKEN,
      identityId: session.identityId,
      expiresIn: 3600,
      authMode: AuthMode.OFFLINE_USER,
    };
  }

  /** Log out. */
  async logout(getCurrentSession: () => AuthSession | null): Promise<{ ok: boolean; error?: string }> {
    this.logger.info('Logout');
    const { sessionRepository } = this.deps;
    const tokenManager = this.deps.getTokenManager();

    try {
      // Stop auto-refresh
      this.deps.stopAutoRefresh();
      this.deps.stopActivityTracking();

      // Revoke the current session
      const currentSession = getCurrentSession();
      if (currentSession) {
        currentSession.revoke();
        await sessionRepository.save(currentSession);
      }

      // Clear tokens
      await tokenManager.clearTokens();

      // Clear the current session
      this.deps.setCurrentSession(null);

      this.logger.info('Logout successful');
      return { ok: true };
    } catch (error) {
      this.logger.error('Logout failed', { error });
      return { ok: false, error: String(error) };
    }
  }

  /**
   * Create a local session after a successful online login.
   *
   * Ensures getCurrentSession() / getCurrentIdentityId() return correct values.
   */
  async activateOnlineSession(params: {
    identityId: string;
    sessionId: string;
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
  }): Promise<void> {
    const tokenManager = this.deps.getTokenManager();

    try {
      await tokenManager.saveTokens({
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        accessTokenExpiresIn: params.expiresIn ?? 3600,
        identityId: toIdentityId(params.identityId),
        sessionId: params.sessionId,
      });
    } catch (error) {
      this.logger.error('Failed to persist online auth tokens locally', {
        identityId: params.identityId,
        sessionId: params.sessionId,
        error: toErrorLog(error),
      });
      throw error;
    }

    try {
      await this.createOnlineSession({
        identityId: params.identityId,
        sessionId: params.sessionId,
        expiresIn: params.expiresIn,
      });
    } catch (error) {
      this.logger.error('Failed to persist online auth session locally', {
        identityId: params.identityId,
        sessionId: params.sessionId,
        error: toErrorLog(error),
      });
      throw error;
    }

    this.deps.startCurrentSessionLifecycle();
  }

  private async createOnlineSession(params: {
    identityId: string;
    sessionId: string;
    expiresIn?: number;
  }): Promise<void> {
    const deviceInfo = this.deps.getDeviceInfo();
    const device = DeviceInfo.create(toDeviceInfoDTO(deviceInfo));

    const session = AuthSession.create({
      id: params.sessionId as unknown as AuthSessionId,
      identityId: toIdentityId(params.identityId),
      refreshTokenHash: generateUUID(),
      expiresAt: Date.now() + (params.expiresIn ?? 3600) * 1000,
      deviceInfo: device.toDTO(),
    });

    this.logger.info('Persisting online session locally', {
      identityId: params.identityId,
      sessionId: params.sessionId,
    });
    await this.deps.sessionRepository.save(session);
    this.deps.setCurrentSession(session);

    this.logger.info('Online session created', {
      identityId: params.identityId,
      sessionId: params.sessionId,
    });
  }

  /**
   * Inject offline authentication dependencies.
   */
  setOfflineAuthDependencies(
    identityRepository: IAuthIdentityRepository,
    passwordHasher: IPasswordHasher,
  ): void {
    this.deps.offlineAuthHelper.setDependencies(identityRepository, passwordHasher);
  }

  /**
   * Save offline credentials.
   */
  async saveOfflineCredentials(
    email: string,
    plainPassword: string,
    identityId: string,
  ): Promise<void> {
    return this.deps.offlineAuthHelper.saveCredentials(email, plainPassword, identityId);
  }

  async removeOfflineCredentials(email: string): Promise<void> {
    return this.deps.offlineAuthHelper.removeCredentials(email);
  }
}
