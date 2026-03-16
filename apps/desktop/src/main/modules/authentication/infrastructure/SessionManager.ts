/**
 * SessionManager - Session lifecycle manager.
 *
 * Coordinates TokenManager and Repository to provide full session lifecycle management.
 *
 * Core features:
 * - Restore the previous session on application startup
 * - Auto-login via Remember-Me / Refresh Token
 * - Session state monitoring and automatic token refresh
 * - Expired session cleanup
 * - Device fingerprint management
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

// ============ SessionManager ============

/**
 * Session manager.
 *
 * Provides full session lifecycle management including:
 * - Session restore and auto-login
 * - Token refresh and status monitoring
 * - Device info management
 * - Session cleanup
 */
export class SessionManager {
  private static instance: SessionManager | null = null;
  private static readonly GUEST_ID_PREFIX = 'GuestIdentity';

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

  // API callbacks (for communicating with the backend)
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

  /** Get the singleton instance. */
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

  /** Reset the singleton instance (for testing only). */
  static resetInstance(): void {
    if (SessionManager.instance) {
      SessionManager.instance.cleanup();
      SessionManager.instance = null;
    }
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
    this.deviceInfo = this.generateDeviceInfo();
    this.logger.debug('Device info generated', { deviceId: this.deviceInfo.deviceId });

    // 2. Attempt to restore session
    const restoreResult = await this.restoreSession();

    // 3. If a valid session exists, start auto-refresh
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

  /** Clean up resources. */
  cleanup(): void {
    this.logger.info('Cleaning up SessionManager');
    this.stopAutoRefresh();
    this.stopActivityTracking();
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
        // Try to find the most recent active session by identity
        const activeSessions = await this.sessionRepository.findByIdentityId(
          tokenData.identityId as unknown as IdentityId,
        );
        if (activeSessions.length === 0) {
          this.logger.info('No persisted session found, reconstructing runtime session from token');
          this.currentSession = await this.restoreRuntimeSessionFromToken(tokenData);
        } else {
          // Use the most recent active session
          this.currentSession = activeSessions[0];
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

      // If no API callback is set, use local refresh
      if (!this.apiRefreshToken) {
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
   * Login (network-aware hybrid).
   *
   * 1. Online: try remote API login -> cache offline credentials on success -> ONLINE_USER
   * 2. Online but network error: fall back to local verification -> OFFLINE_USER
   * 3. Online but auth failure (401/403): return error directly, no fallback
   * 4. Offline: verify against locally stored credentials -> OFFLINE_USER
   * 5. No local credentials: return error requiring initial online login
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
   * Local login (offline password verification).
   *
   * Verifies the password against local AuthIdentity + Argon2,
   * creates a local session, and returns OFFLINE_USER mode.
   */
  private async localLogin(request: LoginRequest): Promise<LoginResponse> {
    this.logger.info('Attempting local login', { identifier: request.identifier });

    // Verify password against locally cached credentials
    const verification = await this.verifyOfflineCredentials(request.identifier, request.password);

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
    if (!this.deviceInfo) {
      this.deviceInfo = this.generateDeviceInfo();
    }
    return this.deviceInfo;
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

  /** Set API callbacks. */
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
   * Inject offline authentication dependencies.
   * @param identityRepository - Identity aggregate repository (for offline password verification)
   * @param passwordHasher - Password hasher (Argon2)
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
   * Save offline credentials.
   *
   * Called after a successful online login/registration. Persists the user's email
   * and password hash to local SQLite for subsequent offline login verification.
   * Uses the server-side identityId for data consistency.
   *
   * @param email - User email
   * @param plainPassword - Plain-text password (hashed locally with Argon2 before storage)
   * @param identityId - Server-assigned identity ID
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
   * Verify credentials offline.
   *
   * Validates the user's password against a locally stored AuthIdentity.
   * Includes failed-attempt counting and lockout (managed by the AuthIdentity aggregate).
   * Returns the server-side identityId when available, otherwise the local ID.
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
   * Get or create a persistent guest identity ID.
   *
   * The guest ID is stored in auth_sessions metadata and persists across app restarts.
   * Can be cleared via clearGuestIdentity() when the user upgrades to a cloud account.
   */
  async getOrCreateGuestIdentity(): Promise<string> {
    const cachedGuestId = this.tokenManager.getCachedTokenData()?.identityId;
    if (cachedGuestId && this.isGuestIdentity(cachedGuestId)) {
      const existingGuestSessions = await this.sessionRepository.findByIdentityId(
        cachedGuestId as unknown as IdentityId,
      );
      if (existingGuestSessions.length > 0) {
        const guestSession = existingGuestSessions[0];
        this.currentSession = guestSession;
        this.logger.info('Restored existing guest identity', {
          guestId: cachedGuestId,
          sessionId: guestSession.id,
        });
        return guestSession.identityId;
      }

      this.logger.info('Reusing cached guest identity without stored session', {
        guestId: cachedGuestId,
      });
      return cachedGuestId;
    }

    // Create new persistent guest identity
    const guestId = `${SessionManager.GUEST_ID_PREFIX}_${generateUUID()}`;

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

  /** Clear guest identity (called when user upgrades to a cloud account). */
  async clearGuestIdentity(): Promise<void> {
    const cachedGuestId = this.tokenManager.getCachedTokenData()?.identityId;
    if (cachedGuestId && this.isGuestIdentity(cachedGuestId)) {
      const guestSessions = await this.sessionRepository.findByIdentityId(
        cachedGuestId as unknown as IdentityId,
      );
      for (const session of guestSessions) {
        session.revoke();
        await this.sessionRepository.save(session);
      }
    }
    this.logger.info('Guest identity cleared');
  }

  private isGuestIdentity(identityId: string | null | undefined): identityId is string {
    return Boolean(identityId?.startsWith(`${SessionManager.GUEST_ID_PREFIX}_`));
  }

  // ============ Private Methods ============

  /** Generate device info. */
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

  /** Generate a device fingerprint. */
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

// ============ Factory Function ============

/** Create a SessionManager instance. */
export function createSessionManager(
  sessionRepository: IAuthSessionRepository,
  identityRepository: IAuthIdentityRepository,
  logger?: ILogger,
): SessionManager {
  return SessionManager.getInstance(sessionRepository, identityRepository, logger);
}
