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
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import * as os from 'os';
import { IdentityId as IdentityIdValue } from '@dailyuse/domain-shared';
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
  type DeviceInfoClientDTO,
} from '@dailyuse/contracts/authentication';
import { TokenManager, getTokenManager, type TokenData } from './TokenManager';

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
  private static readonly GUEST_ID_PREFIX = 'IdentityId';
  private static readonly LOCAL_ACCESS_TOKEN = 'local-token';
  private static readonly GUEST_ACCESS_TOKEN = 'guest-local-token';

  private readonly logger: ILogger;
  private readonly tokenManager: TokenManager;
  private readonly sessionRepository: IAuthSessionRepository;

  // Offline credential infrastructure
  private identityRepository: IAuthIdentityRepository | null = null;
  private passwordHasher: IPasswordHasher | null = null;
  // Maps email → server-side identityId for offline session creation
  // (No longer needed — local AuthIdentity is now stored with the server ID directly)

  private currentSession: AuthSession | null = null;
  private deviceInfo: DeviceInfoClientDTO | null = null;
  private isInitialized = false;
  private activityTimer: NodeJS.Timeout | null = null;
  private sharedAuthDir: string = path.join(app.getPath('userData'), 'auth');

  // API callbacks (for communicating with the backend)
  private apiRefreshToken:
    | ((request: RefreshSessionRequest) => Promise<RefreshSessionResponse>)
    | null = null;

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

  /** Get the existing singleton, throwing if not yet initialized. */
  static getExistingInstance(): SessionManager {
    if (!SessionManager.instance) {
      throw new Error('SessionManager not yet initialized — call createSessionManager first');
    }
    return SessionManager.instance;
  }

  /**
   * Set the shared auth directory for device-id storage.
   * Must be called before initialize() when using the multi-profile architecture.
   */
  setSharedAuthDir(dir: string): void {
    this.sharedAuthDir = dir;
    this.logger.info('Shared auth directory set', { sharedAuthDir: dir });
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
    this.deviceInfo = null;
  }

  /**
   * Activate a profile runtime.
   * Re-initializes session state for the new profile.
   */
  async activateProfile(): Promise<void> {
    this.logger.info('Activating profile runtime');
    this.currentSession = null;
    this.deviceInfo = null;
    this.isInitialized = false;
    // Re-initialize — next call to restoreSession/autoLogin will work with
    // the profile's tokens (TokenManager.switchToProfile has already been called)
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

      if (this.isGuestToken(tokenData)) {
        const expectedIdentityPrefix = `${SessionManager.GUEST_ID_PREFIX}_`;
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
        } else if (this.isGuestToken(tokenData)) {
          this.logger.info(
            'No persisted guest session found, reconstructing runtime session from token',
          );
          this.currentSession = await this.restoreRuntimeSessionFromToken(tokenData);
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
        this.isGuestToken(tokenData) ||
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
      accessToken: 'local-token',
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
      identityId: toIdentityId(verification.identityId!),
      refreshTokenHash: generateUUID(),
      expiresAt: Date.now() + 3600 * 1000,

      deviceInfo: device.toDTO(),
    });

    await this.sessionRepository.save(session);
    this.currentSession = session;

    await this.tokenManager.saveTokens({
      accessToken: SessionManager.LOCAL_ACCESS_TOKEN,
      refreshToken: SessionManager.LOCAL_ACCESS_TOKEN,
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
      accessToken: SessionManager.LOCAL_ACCESS_TOKEN,
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
    if (tokenData && !this.isLocalOnlyToken(tokenData) && !this.isGuestToken(tokenData)) {
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
    this.identityRepository = identityRepository;
    this.passwordHasher = passwordHasher;
    this.logger.info('Offline auth dependencies injected');
  }

  // ============ Offline Credential Management ============

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
        id: toIdentityId(identityId),
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

  // ============ Guest Identity Management ============

  /**
   * Get or create a persistent guest identity ID.
   */
  async getOrCreateGuestIdentity(): Promise<string> {
    const tokenData =
      this.tokenManager.getCachedTokenData() ?? (await this.tokenManager.loadTokens());
    const cachedGuestId = tokenData?.identityId;
    const expectedIdentityPrefix = `${SessionManager.GUEST_ID_PREFIX}_`;

    if (cachedGuestId && this.isGuestToken(tokenData)) {
      if (!cachedGuestId.startsWith(expectedIdentityPrefix)) {
        this.logger.warn('Discarding stale guest token with unsupported identity prefix', {
          identityId: cachedGuestId,
          expectedPrefix: expectedIdentityPrefix,
        });
        await this.tokenManager.clearTokens();
      } else {
        const existingGuestSessions = await this.sessionRepository.findByIdentityId(
          toIdentityId(cachedGuestId),
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

        this.currentSession = await this.restoreRuntimeSessionFromToken({
          ...(tokenData as any),
          identityId: cachedGuestId,
        });
        this.logger.info('Reused cached guest identity with reconstructed session', {
          guestId: cachedGuestId,
          sessionId: this.currentSession.id,
        });
        return cachedGuestId;
      }
    }

    // Create new persistent guest identity
    const guestId = `${SessionManager.GUEST_ID_PREFIX}_${generateUUID()}`;

    const deviceInfo = this.getDeviceInfo();
    const device = DeviceInfo.create(deviceInfo as any);

    const session = AuthSession.create({
      id: generateUUID() as unknown as AuthSessionId,
      identityId: toIdentityId(guestId),
      refreshTokenHash: generateUUID(),
      expiresAt: Date.now() + 3600 * 1000,

      deviceInfo: device.toDTO(),
    });

    this.logger.info('Persisting new guest session locally', {
      guestId,
      sessionId: session.id,
    });
    await this.sessionRepository.save(session);

    try {
      // Save guest tokens locally
      this.logger.info('Persisting guest tokens locally', {
        guestId,
        sessionId: session.id,
      });
      await this.tokenManager.saveTokens({
        accessToken: SessionManager.GUEST_ACCESS_TOKEN,
        refreshToken: SessionManager.GUEST_ACCESS_TOKEN,
        accessTokenExpiresIn: 365 * 24 * 3600, // 1 year for guest
        refreshTokenExpiresIn: 365 * 24 * 3600,
        identityId: toIdentityId(guestId),
        sessionId: session.id,
      });
    } catch (error) {
      session.revoke();
      await this.sessionRepository.save(session).catch((cleanupError) => {
        this.logger.warn('Failed to roll back guest session after token persistence failure', {
          cleanupError,
          guestId,
          sessionId: session.id,
        });
      });
      throw error;
    }

    this.currentSession = session;
    this.startCurrentSessionLifecycle();

    this.logger.info('Created new guest identity', { guestId, sessionId: session?.id });
    return guestId;
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
    const tokenData =
      this.tokenManager.getCachedTokenData() ?? (await this.tokenManager.loadTokens());
    const cachedGuestId = tokenData?.identityId;

    if (cachedGuestId && this.isGuestToken(tokenData)) {
      const guestSessions = await this.sessionRepository.findByIdentityId(
        toIdentityId(cachedGuestId),
      );
      for (const session of guestSessions) {
        session.revoke();
        await this.sessionRepository.save(session);
      }
    }
    this.logger.info('Guest identity cleared');
  }

  private isGuestToken(tokenData: { accessToken?: string; refreshToken?: string } | null): boolean {
    if (!tokenData) return false;
    return (
      tokenData.accessToken === SessionManager.GUEST_ACCESS_TOKEN &&
      tokenData.refreshToken === SessionManager.GUEST_ACCESS_TOKEN
    );
  }

  private isLocalOnlyToken(
    tokenData: { accessToken?: string; refreshToken?: string } | null,
  ): boolean {
    if (!tokenData) return false;
    return (
      tokenData.accessToken === SessionManager.LOCAL_ACCESS_TOKEN &&
      tokenData.refreshToken === SessionManager.LOCAL_ACCESS_TOKEN
    );
  }

  // ============ Private Methods ============

  /** Generate device info. */
  private generateDeviceInfo(): DeviceInfoClientDTO {
    const machineId = this.getOrCreateInstallationDeviceId();
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

  private getOrCreateInstallationDeviceId(): string {
    const authDir = this.sharedAuthDir;
    const deviceIdPath = path.join(authDir, 'device-id');

    try {
      if (fs.existsSync(deviceIdPath)) {
        const persistedId = fs.readFileSync(deviceIdPath, 'utf8').trim();
        if (persistedId.length > 0) {
          return persistedId;
        }
      }
    } catch (error) {
      this.logger.warn('Failed to read persisted desktop device id, regenerating', { error });
    }

    const generatedId = crypto.randomUUID();

    try {
      fs.mkdirSync(authDir, { recursive: true });
      fs.writeFileSync(deviceIdPath, generatedId, 'utf8');
    } catch (error) {
      this.logger.warn('Failed to persist desktop device id, using in-memory fallback', { error });
    }

    return generatedId;
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
      identityId: toIdentityId(tokenData.identityId),
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

// ============ Factory Function ============

/** Create a SessionManager instance. */
export function createSessionManager(
  sessionRepository: IAuthSessionRepository,
  identityRepository: IAuthIdentityRepository,
  logger?: ILogger,
): SessionManager {
  return SessionManager.getInstance(sessionRepository, identityRepository, logger);
}

/** Get the existing SessionManager singleton. Throws if not yet initialized. */
export function getSessionManager(): SessionManager {
  return SessionManager.getExistingInstance();
}
