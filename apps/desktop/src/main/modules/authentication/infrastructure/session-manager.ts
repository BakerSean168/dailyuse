/**
 * SessionManager - Session lifecycle coordinator.
 *
 * Thin orchestrator that delegates to focused helpers:
 * - SessionRestoreOrchestrator: session restore and auto-login
 * - TokenRefreshOrchestrator: token refresh and auto-refresh lifecycle
 * - LoginOrchestrator: login/logout flows and online session creation
 * - DeviceIdentityHelper: device fingerprint management
 * - GuestIdentityHelper: guest identity management
 * - OfflineAuthHelper: offline credential management
 */

import { app } from 'electron';
import { createLogger } from '@memoflow/utils/logger';
import type { ILogger } from '@memoflow/utils/logger';
import type { AuthSession } from '@memoflow/authentication/electron';
import type {
  IAuthSessionRepository,
  IAuthIdentityRepository,
} from '@memoflow/authentication/electron';
import type { IPasswordHasher } from '@memoflow/authentication/electron';
import type {
  RefreshSessionRequest,
  RefreshSessionResponse,
  LoginRequest,
  DeviceInfoClientDTO,
} from '@memoflow/contracts/authentication';
import { TokenManager } from './token-manager';
import { DeviceIdentityHelper } from './device-identity-helper';
import { GuestIdentityHelper } from './guest-identity-helper';
import { OfflineAuthHelper } from './offline-auth-helper';
import { SessionRestoreOrchestrator } from './session-restore';
import { TokenRefreshOrchestrator } from './token-refresh';
import { LoginOrchestrator } from './login-orchestrator';
import type { SessionRestoreResult, AutoLoginResult, SessionStatus } from './session-types';
// Residual 925: OfflineLoginResponse from contracts sole body (no session-types alias).
import type { OfflineLoginResponse } from '@memoflow/contracts/authentication';

// ============ SessionManager ============

/**
 * Session lifecycle coordinator.
 *
 * Delegates to focused orchestrators for each concern area.
 */
export class SessionManager {
  private readonly logger: ILogger;
  private readonly tokenManager: TokenManager;
  private readonly sessionRepository: IAuthSessionRepository;

  readonly deviceIdentityHelper: DeviceIdentityHelper;
  readonly guestIdentityHelper: GuestIdentityHelper;
  readonly offlineAuthHelper: OfflineAuthHelper;

  private readonly restoreOrchestrator: SessionRestoreOrchestrator;
  private readonly refreshOrchestrator: TokenRefreshOrchestrator;
  private readonly loginOrchestrator: LoginOrchestrator;

  private currentSession: AuthSession | null = null;
  private isInitialized = false;
  private activityTimer: NodeJS.Timeout | null = null;

  // API callbacks (for communicating with the backend)
  private apiRefreshToken:
    | ((request: RefreshSessionRequest) => Promise<RefreshSessionResponse>)
    | null = null;

  constructor(
    sessionRepository: IAuthSessionRepository,
    identityRepository: IAuthIdentityRepository,
    tokenManager: TokenManager,
    logger?: ILogger,
  ) {
    this.logger = logger || createLogger('SessionManager');
    this.tokenManager = tokenManager;
    this.sessionRepository = sessionRepository;

    this.deviceIdentityHelper = new DeviceIdentityHelper(
      app.getPath('userData') + '/auth',
      this.logger,
    );
    this.guestIdentityHelper = new GuestIdentityHelper(
      () => this.tokenManager,
      sessionRepository,
      this.logger,
    );
    this.offlineAuthHelper = new OfflineAuthHelper(this.logger);

    // Shared deps for orchestrators — use getters for mutable state so tests can
    // replace (manager as any).tokenManager after construction.
    const sharedDeps = {
      getTokenManager: () => this.tokenManager,
      sessionRepository: this.sessionRepository,
      guestIdentityHelper: this.guestIdentityHelper,
      getDeviceInfo: () => this.getDeviceInfo(),
      getCurrentSession: () => this.currentSession,
      setCurrentSession: (s: AuthSession | null) => { this.currentSession = s; },
      startCurrentSessionLifecycle: () => this.startCurrentSessionLifecycle(),
    };

    this.restoreOrchestrator = new SessionRestoreOrchestrator({
      ...sharedDeps,
      refreshSession: () => this.refreshOrchestrator.refreshSession(),
    }, this.logger);

    this.refreshOrchestrator = new TokenRefreshOrchestrator({
      ...sharedDeps,
      getApiRefreshToken: () => this.apiRefreshToken,
    }, this.logger);

    this.loginOrchestrator = new LoginOrchestrator({
      ...sharedDeps,
      offlineAuthHelper: this.offlineAuthHelper,
      stopAutoRefresh: () => this.refreshOrchestrator.stopAutoRefresh(),
      stopActivityTracking: () => this.stopActivityTracking(),
    }, this.logger);

    this.logger.info('SessionManager created');
  }

  /**
   * Set the shared auth directory for device-id storage.
   * Must be called before initialize() when using the multi-profile architecture.
   */
  setSharedAuthDir(dir: string): void {
    this.deviceIdentityHelper.setSharedAuthDir(dir);
  }

  // ============ Initialization ============

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

    this.deviceIdentityHelper.generateDeviceInfo();
    this.logger.debug('Device info generated');

    const restoreResult = await this.restoreOrchestrator.restoreSession();

    if (restoreResult.ok && this.currentSession) {
      this.startCurrentSessionLifecycle();
    }

    this.isInitialized = true;
    this.logger.info('SessionManager initialized', {
      hasSession: restoreResult.ok,
      identityId: restoreResult.identityId,
    });

    return restoreResult;
  }

  cleanup(): void {
    this.logger.info('Cleaning up SessionManager');
    this.refreshOrchestrator.stopAutoRefresh();
    this.stopActivityTracking();
    this.currentSession = null;
    this.isInitialized = false;
  }

  async deactivateProfile(): Promise<void> {
    this.logger.info('Deactivating profile runtime');
    this.refreshOrchestrator.stopAutoRefresh();
    this.stopActivityTracking();
    this.currentSession = null;
    this.isInitialized = false;
  }

  async activateProfile(): Promise<void> {
    this.logger.info('Activating profile runtime');
    this.currentSession = null;
    this.isInitialized = false;
  }

  // ============ Delegated Methods ============

  async restoreSession(): Promise<SessionRestoreResult> {
    return this.restoreOrchestrator.restoreSession();
  }

  async autoLogin(): Promise<AutoLoginResult> {
    return this.restoreOrchestrator.autoLogin();
  }

  async refreshSession(): Promise<RefreshSessionResponse> {
    return this.refreshOrchestrator.refreshSession();
  }

  async syncCurrentSessionExpiry(durationMs: number): Promise<void> {
    return this.refreshOrchestrator.syncCurrentSessionExpiry(durationMs);
  }

  async loginOffline(request: LoginRequest): Promise<OfflineLoginResponse> {
    return this.loginOrchestrator.loginOffline(request);
  }

  async logout(): Promise<{ ok: boolean; error?: string }> {
    return this.loginOrchestrator.logout(() => this.currentSession);
  }

  async activateOnlineSession(params: {
    identityId: string;
    sessionId: string;
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
  }): Promise<void> {
    return this.loginOrchestrator.activateOnlineSession(params);
  }

  // ============ Session Status ============

  async getStatus(): Promise<SessionStatus> {
    const tokenStatus = await this.tokenManager.getStatus();
    const deviceInfo = this.getDeviceInfo();

    return {
      hasActiveSession: this.currentSession?.isValid() ?? false,
      sessionId: this.currentSession?.id,
      identityId: this.currentSession?.identityId,
      tokenStatus,
      device: deviceInfo,
      lastActivityAt: this.currentSession?.lastActiveAt,
      sessionCreatedAt: this.currentSession?.createdAt,
      sessionExpiresAt: this.currentSession?.expiresAt,
    };
  }

  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  getDeviceInfo(): DeviceInfoClientDTO {
    return this.deviceIdentityHelper.generateDeviceInfo();
  }

  // ============ Cleanup ============

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

  async cleanupOtherSessions(identityId: string): Promise<number> {
    this.logger.info('Cleaning up other sessions', { identityId });

    try {
      const sessions = await this.sessionRepository.findByIdentityId(
        identityId as unknown as import('@memoflow/contracts/authentication').IdentityId,
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

  setApiCallbacks(callbacks: {
    refreshToken?: (request: RefreshSessionRequest) => Promise<RefreshSessionResponse>;
  }): void {
    this.apiRefreshToken = callbacks.refreshToken ?? null;
    this.logger.debug('API callbacks set');
  }

  // ============ Offline Auth Dependencies ============

  setOfflineAuthDependencies(
    identityRepository: IAuthIdentityRepository,
    passwordHasher: IPasswordHasher,
  ): void {
    this.loginOrchestrator.setOfflineAuthDependencies(identityRepository, passwordHasher);
  }

  // ============ Offline Credential Management ============

  async saveOfflineCredentials(
    email: string,
    plainPassword: string,
    identityId: string,
  ): Promise<void> {
    return this.loginOrchestrator.saveOfflineCredentials(email, plainPassword, identityId);
  }

  async removeOfflineCredentials(email: string): Promise<void> {
    return this.loginOrchestrator.removeOfflineCredentials(email);
  }

  // ============ Guest Identity Management ============

  async getOrCreateGuestIdentity(): Promise<string> {
    const result = await this.guestIdentityHelper.getOrCreateGuestIdentity(
      () => this.getDeviceInfo(),
    );
    this.currentSession = result.session;
    this.startCurrentSessionLifecycle();
    return result.guestId;
  }

  async ensureCurrentSession(): Promise<AuthSession | null> {
    if (this.currentSession?.isValid()) {
      return this.currentSession;
    }

    const restoreResult = await this.restoreOrchestrator.restoreSession();
    return restoreResult.ok ? this.currentSession : null;
  }

  async clearGuestIdentity(): Promise<void> {
    return this.guestIdentityHelper.clearGuestIdentity();
  }

  // ============ Private Methods ============

  /** Ensure timers are active for the current session. */
  private startCurrentSessionLifecycle(): void {
    if (!this.currentSession) {
      return;
    }

    this.startActivityTracking();

    const tokenData = this.tokenManager.getCachedTokenData();
    if (
      tokenData &&
      !this.refreshOrchestrator.isLocalOnlyToken(tokenData) &&
      !this.guestIdentityHelper.isGuestToken(tokenData)
    ) {
      this.refreshOrchestrator.startAutoRefresh();
    }
  }

  /** Start activity tracking. */
  private startActivityTracking(): void {
    this.stopActivityTracking();

    // Record activity every 5 minutes
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

  /** Stop activity tracking. */
  private stopActivityTracking(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }
}
