/**
 * Logout Service
 *
 * Application service for user logout.
 */

import type { IAuthSessionRepository } from '@/domain-server';
import type { LogoutReq, LogoutRes } from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('Logout');

/**
 * Logout Service
 */
export class Logout {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * Execute logout (revokes current session).
   */
  async execute(input: LogoutReq, cx: Context): Promise<LogoutRes> {
    logger.info('[Logout] Starting logout', { identityId: cx.identityId });

    try {
      // 1. Find all active sessions for the current user
      const sessions = await this.sessionRepository.findByIdentityId(IdentityId.of(cx.identityId));

      // 2. Revoke all sessions (domain events created internally)
      for (const session of sessions) {
        if (session.isValid()) {
          session.revoke();
          await this.sessionRepository.save(session); // Repository dispatches domain events automatically
        }
      }

      logger.info('[Logout] Logout successful', {
        identityId: cx.identityId,
        revokedSessions: sessions.length,
      });
    } catch (error) {
      logger.error('[Logout] Logout failed', {
        identityId: cx.identityId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
