/**
 * Logout Use Case
 *
 * Application use case for user logout.
 */

import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { IAuthSessionRepository } from '../../../domain-server';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { createLogger } from '@dailyuse/utils/logger';

const logger = createLogger('Logout');

/**
 * Logout Use Case
 */
export class LogoutUseCase {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  /**
   * Execute logout (revokes all sessions for current identity).
   */
  async execute(_input: void, cx: ExecutionContext): Promise<Result<void>> {
    logger.info('[Logout] Starting logout', { identityId: cx.identityId });

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

    return ok(undefined);
  }
}
