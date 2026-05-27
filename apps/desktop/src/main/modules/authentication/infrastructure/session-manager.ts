/**
 * SessionManager - Session lifecycle coordinator.
 *
 * Coordinates TokenManager, repositories, and extracted helpers to provide
 * full session lifecycle management.
 *
 * Core features:
 * - Restore the previous session on application startup
 * - Auto-login via Remember-Me / Refresh Token
 * - Session state monitoring and automatic token refresh
 * - Expired session cleanup
 * - Device fingerprint management (delegated to DeviceIdentityHelper)
 * - Guest identity management (delegated to GuestIdentityHelper)
 * - Offline credential management (delegated to OfflineAuthHelper)
 */

import { app } from 'electron';
import { IdentityId as IdentityIdValue } from '@dailyuse/domain-shared';
import { createLogger } from '@dailyuse/utils/logger';
import type { ILogger } from '@dailyuse/utils/logger';
import { generateUUID } from '@dailyuse/utils/shared';
import { AuthSession } from '@dailyuse/authentication/domain-server';
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
  type DeviceInfoClientDTO,
} from '@dailyuse/contracts/authentication';
import { TokenManager, type TokenData } from './token-manager';
import { DeviceIdentityHelper } from './device-identity-helper';
import { GuestIdentityHelper } from './guest-identity-helper';
import { OfflineAuthHelper } from './offline-auth-helper';

// ============ Internal Types ============

/** Extended session restore result (includes domain objects). */
export interface SessionRestoreResult extends ContractSessionRestoreResult {
  session?: AuthSession;
}

/** Extended auto-login result (includes domain objects). */
export interface AutoLoginResult extends ContractAutoLoginResult {
  session?: AuthSession;
}

/** Session status (extends DTO with device info). */
export interface SessionStatus extends Omit<SessionStatusDTO, 'device'> {
  device: DeviceInfoClientDTO;
}

type OfflineLoginResponse = {
  ok: boolean;
  sessionId?: string;
  accessToken?: string;
  identityId?: string;
  expiresIn?: number;
  error?: string;
  authMode?: AuthMode;
};

function toIdentityId(value: string | IdentityId): IdentityId {
  return IdentityIdValue.of(String(value));
}

function toErrorLog(error: unknown): unknown {
  if (error instanceof Error) {
    const details: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    const withCause = error as Error & { cause?: unknown };
    if (withCause.cause !== undefined) {
      details.cause = toErrorLog(withCause.cause);
    }

    return details;
  }

  return error;
}

// ============ Constants ============

const LOCAL_ACCESS_TOKEN = 'local-token';
const GUEST_ACCESS_TOKEN = 'guest-local-token';

// ============ SessionManager ============

/**
 * Session lifecycle coordinator.
 *
 * Provides full session lifecycle management including:
 * - Session restore and auto-login
 * - Token refresh and status monitoring
 * - Device info management (via DeviceIdentityHelper)
 * - Guest identity management (via GuestIdentityHelper)
 * - Offline credential management (via OfflineAuthHelper)
 * - Session cleanup
 */
export class SessionManager {
  private readonly logger: ILogger;
  private readonly tokenManager: TokenManager;
  private readonly sessionRepository: IAuthSessionRepository;

  readonly deviceIdentityHelper: DeviceIdentityHelper;
  readonly guestIdentityHelper: GuestIdentityHelper;
  readonly offlineAuthHelper: OfflineAuthHelper;

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

  /**
   * Initialize the SessionManager.
   *
   * Should be called at application startup. Steps:
   * 1. Generate device info
   * 2. Attempt to restore the previous session
   * 3. Start auto-refresh
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

    // 1. Generate device info
    this.deviceIdentityHelper.generateDeviceInfo();
    this.logger.debug('Device info generated');

    // 2. Attempt to restore session
    const restoreResult = await this.restoreSession();

    // 3. If a valid session exists, start auto-refresh
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

  /** Clean up resources. */
  cleanup(): void {
    this.logger.info('Cleaning up SessionManager');
    this.stopAutoRefresh();
    this.stopActivityTracking();
    this.currentSession = null;
    this.isInitialized = false;
  }

  /**
   * Deactivate the current profile runtime.
   * Stops timers and clears session reference, but does NOT delete tokens or session data.
   */
  async deactivateProfile(): Promise<void> {
    this.logger.info('Deactivating profile runtime');
    this.stopAutoRefresh();
    this.stopActivityTracking();
    this.currentSession = null;
    this.isInitialized = false;
  }

  /**
   * Activate a profile runtime.
   * Re-initializes session state for the new profile.
   */
  async activateProfile(): Promise<void> {
    this.logger.info('Activating profile runtime');
    this.currentSession = null;
    this.isInitialized = false;
  }

  // ============ Session Restore ============

  /**
   * Restore the session from local storage.
   *
   * 1. Load tokens
   * 2. Find the corresponding session record
   * 3. Validate the session
   * 4. If the access token is expired but the refresh token is valid, flag for refresh
   */
  async restoreSession(): Promise<SessionRestoreResult> {
    this.logger.info('Attempting to restore session');

    try {
      // 1. Load tokens
      const tokenData = await this.tokenManager.loadTokens();
      if (!tokenData) {
        this.logger.info('No tokens found, no session to restore');
        return { ok: false, needsReLogin: true };
      }

      if (this.guestIdentityHelper.isGuestToken(tokenData)) {
        const expectedIdentityPrefix = 'IdentityId_';
        if (!tokenData.identityId.startsWith(expectedIdentityPrefix)) {
          this.logger.warn('Discarding stale guest token with unsupported identity prefix', {
            identityId: tokenData.identityId,
            expectedPrefix: expectedIdentityPrefix,
          });
          await this.tokenManager.clearTokens();
          this.currentSession = null;
          return { ok: false, needsReLogin: true };
        }
      }

      // 2. Check if the refresh token is expired
      const now = Date.now();
      if (now > tokenData.refreshTokenExpiresAt) {
        this.logger.info('Refresh token expired, need re-login');
        await this.tokenManager.clearTokens();
        return { ok: false, needsReLogin: true };
      }

      // 3. Find the session record
      const session = await this.sessionRepository.findById(
        tokenData.sessionId as unknown as AuthSessionId,
      );
      if (!session) {
        this.logger.warn('Session not found in database', { sessionId: tokenData.sessionId });
        const activeSessions = await this.sessionRepository.findByIdentityId(
          toIdentityId(tokenData.identityId),
        );
        const validActiveSession = activeSessions.find((candidate) => candidate.isValid());

        if (validActiveSession) {
          this.currentSession = validActiveSession;
        } else if (this.guestIdentityHelper.isGuestToken(tokenData)) {
          this.logger.info(
            'No persisted guest session found, reconstructing runtime session from token',
          );
          const result = await this.guestIdentityHelper.getOrCreateGuestIdentity(
            () => this.getDeviceInfo(),
          );
          this.currentSession = result.session;
        } else {
          this.logger.info('No valid persisted session found for identity, clearing tokens');
          await this.tokenManager.clearTokens();
          this.currentSession = null;
          return { ok: false, needsReLogin: true };
        }
      } else {
        // 4. Validate the session
        if (!session.isValid()) {
          this.logger.info('Session is invalid (revoked/expired)');
          await this.tokenManager.clearTokens();
          return { ok: false, needsReLogin: true };
        }
        this.currentSession = session;
      }

      // 5. Check if the access token needs refreshing
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
   * Auto-login using stored refresh token.
   *
   * 1. Check for a valid refresh token
   * 2. Call the API to refresh the token
   * 3. Update local session and token storage
   */
  async autoLogin(): Promise<AutoLoginResult> {
    this.logger.info('Attempting auto login');

    try {
      // 1. Check tokens
      const tokenData = await this.tokenManager.loadTokens();
      if (!tokenData) {
        return { ok: false, authenticated: false, error: 'No tokens available' };
      }

      // 2. Check if the refresh token is expired
      if (Date.now() > tokenData.refreshTokenExpiresAt) {
        this.logger.info('Refresh token expired');
        await this.tokenManager.clearTokens();
        return { ok: false, authenticated: false, error: 'Refresh token expired' };
      }

      // 3. If the access token is still valid, restore the session directly
      if (Date.now() < tokenData.accessTokenExpiresAt) {
        const restoreResult = await this.restoreSession();
        if (restoreResult.ok) {
          this.startCurrentSessionLifecycle();
          return {
            ok: true,
            authenticated: true,
            session: restoreResult.session,
            identityId: restoreResult.identityId,
            isNewSession: false,
          };
        }
      }

      // 4. Token needs refreshing
      const refreshResult = await this.refreshSession();
      if (!refreshResult.ok) {
        return { ok: false, authenticated: false, error: refreshResult.error };
      }

      this.startCurrentSessionLifecycle();

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
   * Refresh the session.
   *
   * Uses the refresh token to obtain a new access token.
   */
  async refreshSession(): Promise<RefreshSessionResponse> {
    this.logger.info('Refreshing session');

    try {
      const tokenData = await this.tokenManager.loadTokens();
      if (!tokenData) {
        return { ok: false, error: 'No tokens to refresh' };
      }

      // Local-only and guest sessions must never hit the remote refresh API.
      if (
        this.isLocalOnlyToken(tokenData) ||
        this.guestIdentityHelper.isGuestToken(tokenData) ||
        !this.apiRefreshToken
      ) {
        return await this.localRefresh(tokenData);
      }

      // Call the API to refresh
      const result = await this.apiRefreshToken({
        refreshToken: tokenData.refreshToken,
        sessionId: tokenData.sessionId,
      });

      if (result.ok && result.accessToken) {
        // Update tokens
        await this.tokenManager.updateAccessToken(result.accessToken, result.expiresIn ?? 3600);

        // If a new refresh token was returned (sliding window), update it too
        if (result.refreshToken) {
          await this.tokenManager.updateRefreshToken(result.refreshToken);
        }

        // Update the session
        await this.syncCurrentSessionExpiry((result.expiresIn ?? 3600) * 1000);

        this.logger.info('Session refreshed successfully via API');
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to refresh session', { error });
      return { ok: false, error: String(error) };
    }
  }

  /**
   * Local refresh (offline mode).
   *
   * In offline mode, simply extends the local session's validity.
   */
  private async localRefresh(tokenData: TokenData): Promise<RefreshSessionResponse> {
    this.logger.info('Performing local refresh (offline mode)');

    // Generate a new local token (effectively just updates the expiry)
    const newExpiresIn = 3600; // 1 hour
    await this.tokenManager.updateAccessToken(tokenData.accessToken, newExpiresIn);

    // Update the session
    await this.syncCurrentSessionExpiry(newExpiresIn * 1000);

    return {
      ok: true,
      accessToken: LOCAL_ACCESS_TOKEN,
      expiresIn: newExpiresIn,
    };
  }

  // ============ Login/Logout ============

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

    // Verify password against locally cached credentials
    const verification = await this.offlineAuthHelper.verifyCredentials(
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
    const deviceInfo = this.getDeviceInfo();
    const device = DeviceInfo.create(deviceInfo as any);

    const session = AuthSession.create({
      id: generateUUID() as unknown as AuthSessionId,
      identityId: toIdentityId(verification.identityId!),
      refreshTokenHash: generateUUID(),
      expiresAt: Date.now() + 3600 * 1000,

      deviceInfo: device.toDTO(),
    });

    await this.sessionRepository.save(session);
    this.currentSession = session;

    await this.tokenManager.saveTokens({
      accessToken: LOCAL_ACCESS_TOKEN,
      refreshToken: LOCAL_ACCESS_TOKEN,
      accessTokenExpiresIn: 3600,
      refreshTokenExpiresIn: 30 * 24 * 3600,
      identityId: toIdentityId(session.identityId),
      sessionId: session.id,
    });

    this.startCurrentSessionLifecycle();

    this.logger.info('Local login successful', {
      identityId: session?.identityId,
      authMode: AuthMode.OFFLINE_USER,
    });

    return {
      ok: true,
      sessionId: session?.id,
      accessToken: LOCAL_ACCESS_TOKEN,
      identityId: session?.identityId,
      expiresIn: 3600,
      authMode: AuthMode.OFFLINE_USER,
    };
  }

  /** Log out. */
  async logout(): Promise<{ ok: boolean; error?: string }> {
    this.logger.info('Logout');

    try {
      // Stop auto-refresh
      this.stopAutoRefresh();
      this.stopActivityTracking();

      // Revoke the current session
      if (this.currentSession) {
        this.currentSession.revoke();
        await this.sessionRepository.save(this.currentSession);
      }

      // Clear tokens
      await this.tokenManager.clearTokens();

      // Clear the current session
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
    try {
      await this.tokenManager.saveTokens({
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

    this.startCurrentSessionLifecycle();
  }

  private async createOnlineSession(params: {
    identityId: string;
    sessionId: string;
    expiresIn?: number;
  }): Promise<void> {
    const deviceInfo = this.getDeviceInfo();
    const device = DeviceInfo.create(deviceInfo as any);

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
    await this.sessionRepository.save(session);
    this.currentSession = session;

    this.logger.info('Online session created', {
      identityId: params.identityId,
      sessionId: params.sessionId,
    });
  }

  /** Ensure timers are active for the current session. */
  private startCurrentSessionLifecycle(): void {
    if (!this.currentSession) {
      return;
    }

    this.startActivityTracking();

    const tokenData = this.tokenManager.getCachedTokenData();
    if (tokenData && !this.isLocalOnlyToken(tokenData) && !this.guestIdentityHelper.isGuestToken(tokenData)) {
      this.startAutoRefresh();
    }
  }

  /** Persist the current session with an extended expiry. */
  async syncCurrentSessionExpiry(durationMs: number): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.extend(durationMs);
    await this.sessionRepository.save(this.currentSession);
  }

  // ============ Session Status ============

  /** Get session status. */
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

  /** Get the current session. */
  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  /** Get device info. */
  getDeviceInfo(): DeviceInfoClientDTO {
    return this.deviceIdentityHelper.generateDeviceInfo();
  }

  // ============ Cleanup ============

  /**
   * Clean up expired sessions.
   *
   * Removes all expired session records.
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

  /** Clean up all sessions for an identity (except the current one). */
  async cleanupOtherSessions(identityId: string): Promise<number> {
    this.logger.info('Cleaning up other sessions', { identityId });

    try {
      const sessions = await this.sessionRepository.findByIdentityId(
        toIdentityId(identityId),
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

  /** Set API callbacks. */
  setApiCallbacks(callbacks: {
    refreshToken?: (request: RefreshSessionRequest) => Promise<RefreshSessionResponse>;
  }): void {
    this.apiRefreshToken = callbacks.refreshToken ?? null;
    this.logger.debug('API callbacks set');
  }

  // ============ Offline Auth Dependencies ============

  /**
   * Inject offline authentication dependencies.
   * @param identityRepository - Identity aggregate repository (for offline password verification)
   * @param passwordHasher - Password hasher (Argon2)
   */
  setOfflineAuthDependencies(
    identityRepository: IAuthIdentityRepository,
    passwordHasher: IPasswordHasher,
  ): void {
    this.offlineAuthHelper.setDependencies(identityRepository, passwordHasher);
  }

  // ============ Offline Credential Management ============

  /**
   * Save offline credentials.
   *
   * Called after a successful online login/registration. Persists the user's email
   * and password hash to local SQLite for subsequent offline login verification.
   * Uses the server-side identityId for data consistency.
   */
  async saveOfflineCredentials(
    email: string,
    plainPassword: string,
    identityId: string,
  ): Promise<void> {
    return this.offlineAuthHelper.saveCredentials(email, plainPassword, identityId);
  }

  async removeOfflineCredentials(email: string): Promise<void> {
    return this.offlineAuthHelper.removeCredentials(email);
  }

  // ============ Guest Identity Management ============

  /**
   * Get or create a persistent guest identity ID.
   */
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

    const restoreResult = await this.restoreSession();
    return restoreResult.ok ? this.currentSession : null;
  }

  /** Clear guest identity (called when user upgrades to a cloud account). */
  async clearGuestIdentity(): Promise<void> {
    return this.guestIdentityHelper.clearGuestIdentity();
  }

  // ============ Private Methods ============

  private isLocalOnlyToken(
    tokenData: { accessToken?: string; refreshToken?: string } | null,
  ): boolean {
    if (!tokenData) return false;
    return (
      tokenData.accessToken === LOCAL_ACCESS_TOKEN &&
      tokenData.refreshToken === LOCAL_ACCESS_TOKEN
    );
  }

  /** Start auto-refresh. */
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

  /** Stop auto-refresh. */
  private stopAutoRefresh(): void {
    this.tokenManager.stopAutoRefresh();
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
