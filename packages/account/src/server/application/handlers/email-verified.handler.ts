/**
 * Email Verified Event Handler
 *
 * Listens to auth:email-verified and projects ContactEmail on Account.
 */

import type { IAccountRepository } from '../../domain';
import { createLogger } from '@dailyuse/utils/logger';
import type { AuthEventMap } from '@dailyuse/contracts/authentication';

const logger = createLogger('EmailVerifiedHandler');

export class EmailVerifiedHandler {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async handle(event: { payload: AuthEventMap['auth:email-verified'] }): Promise<void> {
    const { identityId, email } = event.payload;

    logger.info('[EmailVerifiedHandler] Handling auth:email-verified event', {
      identityId,
      email,
    });

    const account = await this.accountRepository.findById(String(identityId));
    if (!account) {
      logger.warn('[EmailVerifiedHandler] Account not found for identity', { identityId });
      return;
    }

    account.syncVerifiedEmail(email);
    await this.accountRepository.save(account);

    logger.info('[EmailVerifiedHandler] Account email projected as verified', {
      identityId,
      email,
    });
  }
}
