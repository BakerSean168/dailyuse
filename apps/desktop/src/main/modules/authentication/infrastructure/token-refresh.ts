/**
 * TokenRefreshOrchestrator — handles token refresh and auto-refresh lifecycle.
 *
 * Extracted from SessionManager to keep the orchestrator thin.
 */

import { createLogger } from '@memoflow/utils/logger';
import type { ILogger } from '@memoflow/utils/logger';
import type { AuthSession, IAuthSessionRepository } from '@memoflow/authentication/electron';
import type {
  RefreshSessionRequest,
  RefreshSessionResponse,
  TokenStorageData,
} from '@memoflow/contracts/authentication';
import { TokenManager } from './token-manager';
import type { GuestIdentityHelper } from './guest-identity-helper';
import { LOCAL_ACCESS_TOKEN } from './session-types';

// ============ Dependencies ============

/** Dependencies required by the token refresh orchestrator. */
export interface TokenRefreshDeps {
  getTokenManager(): TokenManager;
  readonly sessionRepository: IAuthSessionRepository;
  readonly guestIdentityHelper: GuestIdentityHelper;
  getCurrentSession(): AuthSession | null;
  getApiRefreshToken(): ((request: RefreshSessionRequest) => Promise<RefreshSessionResponse>) | null;
}

// ============ TokenRefreshOrchestrator ============

export class TokenRefreshOrchestrator {
  private readonly logger: ILogger;
  private readonly deps: TokenRefreshDeps;

  constructor(deps: TokenRefreshDeps, logger?: ILogger) {
    this.deps = deps;
    this.logger = logger || createLogger('TokenRefreshOrchestrator');
  }

  /**
   * Refresh the session.
   *
   * Uses the refresh token to obtain a new access token.
   */
  async refreshSession(): Promise<RefreshSessionResponse> {
    this.logger.info('Refreshing session');
    const tokenManager = this.deps.getTokenManager();
    const { guestIdentityHelper } = this.deps;

    try {
      const tokenData = await tokenManager.loadTokens();
      if (!tokenData) {
        return { ok: false, error: 'No tokens to refresh' };
      }

      // Local-only and guest sessions must never hit the remote refresh API.
      const apiRefresh = this.deps.getApiRefreshToken();
      if (
        this.isLocalOnlyToken(tokenData) ||
        guestIdentityHelper.isGuestToken(tokenData) ||
        !apiRefresh
      ) {
        return await this.localRefresh(tokenData);
      }

      // Call the API to refresh
      const result = await apiRefresh({
        refreshToken: tokenData.refreshToken,
        sessionId: tokenData.sessionId,
      });

      if (result.ok && result.accessToken) {
        // Update tokens
        await tokenManager.updateAccessToken(result.accessToken, result.expiresIn ?? 3600);

        // If a new refresh token was returned (sliding window), update it too
        if (result.refreshToken) {
          await tokenManager.updateRefreshToken(result.refreshToken);
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
  private async localRefresh(tokenData: TokenStorageData): Promise<RefreshSessionResponse> {
    this.logger.info('Performing local refresh (offline mode)');
    const tokenManager = this.deps.getTokenManager();

    // Generate a new local token (effectively just updates the expiry)
    const newExpiresIn = 3600; // 1 hour
    await tokenManager.updateAccessToken(tokenData.accessToken, newExpiresIn);

    // Update the session
    await this.syncCurrentSessionExpiry(newExpiresIn * 1000);

    return {
      ok: true,
      accessToken: LOCAL_ACCESS_TOKEN,
      expiresIn: newExpiresIn,
    };
  }

  /** Persist the current session with an extended expiry. */
  async syncCurrentSessionExpiry(durationMs: number): Promise<void> {
    const currentSession = this.deps.getCurrentSession();
    if (!currentSession) {
      return;
    }

    currentSession.extend(durationMs);
    await this.deps.sessionRepository.save(currentSession);
  }

  /** Start auto-refresh. */
  startAutoRefresh(): void {
    this.deps.getTokenManager().startAutoRefresh(async () => {
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
  stopAutoRefresh(): void {
    this.deps.getTokenManager().stopAutoRefresh();
  }

  isLocalOnlyToken(
    tokenData: { accessToken?: string; refreshToken?: string } | null,
  ): boolean {
    if (!tokenData) return false;
    return (
      tokenData.accessToken === LOCAL_ACCESS_TOKEN &&
      tokenData.refreshToken === LOCAL_ACCESS_TOKEN
    );
  }
}
