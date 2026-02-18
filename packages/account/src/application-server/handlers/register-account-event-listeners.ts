/**
 * Account Event Listeners Registration
 *
 * Registers cross-module event listeners for Account module.
 */

import type { IAccountRepository } from '../../domain-server';
import type { AuthEventMap } from '@dailyuse/contracts/authentication';
import { createLogger, eventBus } from '@dailyuse/utils';
import { IdentityCreatedHandler } from './identity-created.handler';

const logger = createLogger('AccountEventListeners');

const AUTH_IDENTITY_CREATED_EVENT = 'auth:identity-created';
let isInitialized = false;

export function registerAccountEventListeners(accountRepository?: IAccountRepository): void {
  if (isInitialized) {
    logger.warn('[AccountEventListeners] Already initialized, skipping');
    return;
  }

  if (!accountRepository) {
    logger.warn(
      '[AccountEventListeners] Account repository not provided, skip auth:identity-created listener registration',
    );
    return;
  }

  const identityCreatedHandler = new IdentityCreatedHandler(accountRepository);

  (eventBus as any).on(
    AUTH_IDENTITY_CREATED_EVENT,
    async (payload: AuthEventMap['auth:identity-created']) => {
      try {
        await identityCreatedHandler.handle({ payload });
      } catch (error) {
        logger.error('[AccountEventListeners] Failed to handle auth:identity-created event', {
          error: error instanceof Error ? error.message : String(error),
          payload,
        });
      }
    },
  );

  isInitialized = true;
  logger.info('[AccountEventListeners] Account event listeners registered successfully');
}
