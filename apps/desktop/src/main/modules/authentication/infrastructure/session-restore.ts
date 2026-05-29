/**
 * SessionRestoreOrchestrator — handles session restore and auto-login flows.
 *
 * Extracted from SessionManager to keep the orchestrator thin.
 */

import { createLogger } from '@dailyuse/utils/logger';
import type { ILogger } from '@dailyuse/utils/logger';
import type { AuthSession, IAuthSessionRepository } from '@dailyuse/authentication/domain-server';
import type { AuthSessionId } from '@dailyuse/contracts/authentication';
import type { TokenManager } from './token-manager';
import type { GuestIdentityHelper } from './guest-identity-helper';
import type { DeviceInfoClientDTO, RefreshSessionResponse } from '@dailyuse/contracts/authentication';
import { toIdentityId } from './session-types';
import type { SessionRestoreResult, AutoLoginResult } from './session-types';

// ============ Dependencies ============

/** Dependencies required by the session restore orchestrator. */
export interface SessionRestoreDeps {
  getTokenManager(): TokenManager;
  readonly sessionRepository: IAuthSessionRepository;
  readonly guestIdentityHelper: GuestIdentityHelper;
  getDeviceInfo(): DeviceInfoClientDTO;
  getCurrentSession(): AuthSession | null;
  setCurrentSession(session: AuthSession | null): void;
  refreshSession(): Promise<RefreshSessionResponse>;
  startCurrentSessionLifecycle(): void;
}

// ============ SessionRestoreOrchestrator ============

export class SessionRestoreOrchestrator {
  private readonly logger: ILogger;
  private readonly deps: SessionRestoreDeps;

  constructor(deps: SessionRestoreDeps, logger?: ILogger) {
    this.deps = deps;
    this.logger = logger || createLogger('SessionRestoreOrchestrator');
  }

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
    const tokenManager = this.deps.getTokenManager();
    const { sessionRepository, guestIdentityHelper } = this.deps;

    try {
      // 1. Load tokens
      const tokenData = await tokenManager.loadTokens();
      if (!tokenData) {
        this.logger.info('No tokens found, no session to restore');
        return { ok: false, needsReLogin: true };
      }

      if (guestIdentityHelper.isGuestToken(tokenData)) {
        const expectedIdentityPrefix = 'IdentityId_';
        if (!tokenData.identityId.startsWith(expectedIdentityPrefix)) {
          this.logger.warn('Discarding stale guest token with unsupported identity prefix', {
            identityId: tokenData.identityId,
            expectedPrefix: expectedIdentityPrefix,
          });
          await tokenManager.clearTokens();
          this.deps.setCurrentSession(null);
          return { ok: false, needsReLogin: true };
        }
      }

      // 2. Check if the refresh token is expired
      const now = Date.now();
      if (now > tokenData.refreshTokenExpiresAt) {
        this.logger.info('Refresh token expired, need re-login');
        await tokenManager.clearTokens();
        return { ok: false, needsReLogin: true };
      }

      // 3. Find the session record
      let currentSession: AuthSession | null = null;
      const session = await sessionRepository.findById(
        tokenData.sessionId as unknown as AuthSessionId,
      );
      if (!session) {
        this.logger.warn('Session not found in database', { sessionId: tokenData.sessionId });
        const activeSessions = await sessionRepository.findByIdentityId(
          toIdentityId(tokenData.identityId),
        );
        const validActiveSession = activeSessions.find((candidate) => candidate.isValid());

        if (validActiveSession) {
          currentSession = validActiveSession;
        } else if (guestIdentityHelper.isGuestToken(tokenData)) {
          this.logger.info(
            'No persisted guest session found, reconstructing runtime session from token',
          );
          const result = await guestIdentityHelper.getOrCreateGuestIdentity(
            () => this.deps.getDeviceInfo(),
          );
          currentSession = result.session;
        } else {
          this.logger.info('No valid persisted session found for identity, clearing tokens');
          await tokenManager.clearTokens();
          this.deps.setCurrentSession(null);
          return { ok: false, needsReLogin: true };
        }
      } else {
        // 4. Validate the session
        if (!session.isValid()) {
          this.logger.info('Session is invalid (revoked/expired)');
          await tokenManager.clearTokens();
          return { ok: false, needsReLogin: true };
        }
        currentSession = session;
      }

      this.deps.setCurrentSession(currentSession);

      // 5. Check if the access token needs refreshing
      const needsRefresh = now > tokenData.accessTokenExpiresAt;
      if (needsRefresh) {
        this.logger.info('Access token expired, needs refresh');
      }

      this.logger.info('Session restored successfully', {
        sessionId: currentSession!.id,
        identityId: currentSession!.identityId,
        needsRefresh,
      });

      return {
        ok: true,
        session: currentSession!,
        identityId: currentSession!.identityId,
        needsRefresh,
      };
    } catch (error) {
      this.logger.error('Failed to restore session', { error });
      return { ok: false, error: String(error), needsReLogin: true };
    }
  }

  /**
   * Auto-login using stored refresh token.
   *
   * 1. Check for a valid refresh token
   * 2. Call the API to refresh the token
   * 3. Update local session and token storage
   */
  async autoLogin(): Promise<AutoLoginResult> {
    this.logger.info('Attempting auto login');
    const tokenManager = this.deps.getTokenManager();

    try {
      // 1. Check tokens
      const tokenData = await tokenManager.loadTokens();
      if (!tokenData) {
        return { ok: false, authenticated: false, error: 'No tokens available' };
      }

      // 2. Check if the refresh token is expired
      if (Date.now() > tokenData.refreshTokenExpiresAt) {
        this.logger.info('Refresh token expired');
        await tokenManager.clearTokens();
        return { ok: false, authenticated: false, error: 'Refresh token expired' };
      }

      // 3. If the access token is still valid, restore the session directly
      if (Date.now() < tokenData.accessTokenExpiresAt) {
        const restoreResult = await this.restoreSession();
        if (restoreResult.ok) {
          this.deps.startCurrentSessionLifecycle();
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
      const refreshResult = await this.deps.refreshSession();
      if (!refreshResult.ok) {
        return { ok: false, authenticated: false, error: refreshResult.error };
      }

      this.deps.startCurrentSessionLifecycle();

      const currentSession = this.deps.getCurrentSession();
      return {
        ok: true,
        authenticated: true,
        session: currentSession ?? undefined,
        identityId: currentSession?.identityId,
        isNewSession: false,
      };
    } catch (error) {
      this.logger.error('Auto login failed', { error });
      return { ok: false, authenticated: false, error: String(error) };
    }
  }
}
