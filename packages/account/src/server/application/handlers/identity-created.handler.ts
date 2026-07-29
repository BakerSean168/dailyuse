/**
 * Identity Created Event Handler
 *
 * Listens to 'auth:identity-created' event from authentication module
 * and creates a corresponding Account entity
 */

import type { IAccountRepository } from '../../domain';
import { Account } from '../../domain';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { createLogger } from '@memoflow/utils/logger';
import type { AuthEventMap } from '@memoflow/contracts/authentication';
import { IdentityCreateMethod } from '@memoflow/contracts/authentication';

const logger = createLogger('IdentityCreatedHandler');

/**
 * Identity Created Event Handler
 *
 * When a new AuthIdentity is created in the authentication module,
 * automatically create a corresponding Account with the same ID
 */
export class IdentityCreatedHandler {
  constructor(private readonly accountRepository: IAccountRepository) {}

  /**
   * Handle auth:identity-created event
   */
  async handle(event: { payload: AuthEventMap['auth:identity-created'] }): Promise<void> {
    const { identityId, createMethod, email, oauthProvider, phoneNumber } = event.payload;

    logger.info('[IdentityCreatedHandler] Handling auth:identity-created event', {
      identityId,
      createMethod,
    });

    try {
      // 1. Check if account already exists (idempotency)
      const existingAccount = await this.accountRepository.findById(IdentityId.of(identityId));
      if (existingAccount) {
        logger.info('[IdentityCreatedHandler] Account already exists, skipping', {
          identityId,
        });
        return;
      }

      // 2. Determine email address based on creation method
      const accountEmail =
        email ||
        (() => {
          if (createMethod === IdentityCreateMethod.Oauth) {
            // For OAuth, we might get email from provider later
            // For now, use a placeholder or throw error
            logger.warn('[IdentityCreatedHandler] No email provided for OAuth identity', {
              identityId,
              oauthProvider,
            });
            throw new Error('Email is required to create an account');
          } else if (createMethod === IdentityCreateMethod.Phone) {
            // For phone registration, email might be added later
            logger.warn('[IdentityCreatedHandler] No email provided for phone identity', {
              identityId,
              phoneNumber,
            });
            throw new Error('Email is required to create an account');
          }
          throw new Error('Email is required to create an account');
        })();

      // 3. Create Account with the same IdentityId
      const account = Account.create({
        id: IdentityId.of(identityId),
        email: accountEmail,
      });

      // 4. Save Account (repository will publish domain events)
      await this.accountRepository.save(account);

      logger.info('[IdentityCreatedHandler] Account created successfully', {
        identityId,
        email: accountEmail,
      });
    } catch (error) {
      logger.error('[IdentityCreatedHandler] Failed to create Account', {
        identityId,
        createMethod,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
