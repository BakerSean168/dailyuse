/**
 * Account Event Listeners Registration
 *
 * Registers cross-module event listeners for Account module.
 */

import type { IAccountRepository } from '../../domain';
import type { AuthEventMap } from '@dailyuse/contracts/authentication';
import { createTypedEventSubscriber, eventBus } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import { IdentityCreatedHandler } from './identity-created.handler';

const logger = createLogger('AccountEventListeners');

const authSubscriber = createTypedEventSubscriber<AuthEventMap>(eventBus);

/**
 * Creates an idempotent runtime contribution for account event subscriptions.
 * 创建可幂等启停的 account 事件订阅 runtime。
 */
export function createAccountEventListenerRuntime(accountRepository: IAccountRepository): {
  start(): void;
  stop(): void;
} {
  const identityCreatedHandler = new IdentityCreatedHandler(accountRepository);
  const onIdentityCreated = async (payload: AuthEventMap['auth:identity-created']) => {
    try {
      await identityCreatedHandler.handle({ payload });
    } catch (error) {
      logger.error('[AccountEventListeners] Failed to handle auth:identity-created event', {
        error: error instanceof Error ? error.message : String(error),
        payload,
      });
    }
  };
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      authSubscriber.on('auth:identity-created', onIdentityCreated);
      started = true;
      logger.info('[AccountEventListeners] Account event listeners registered successfully');
    },
    stop(): void {
      if (!started) {
        return;
      }

      authSubscriber.off('auth:identity-created', onIdentityCreated);
      started = false;
      logger.info('[AccountEventListeners] Account event listeners unregistered');
    },
  };
}
