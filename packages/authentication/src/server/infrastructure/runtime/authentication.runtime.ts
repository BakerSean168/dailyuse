/**
 * Authentication runtime contributions for server transports.
 * Authentication 服务端传输层的运行时贡献。
 *
 * This file keeps side effects explicit and reversible.
 * Instead of globally registering initialization tasks, the authentication module
 * now owns its event subscriptions through a small runtime object.
 *
 * 这个文件让副作用显式且可逆。
 * authentication 不再通过全局初始化任务注册监听器，而是通过一个轻量的
 * runtime 对象管理自身事件订阅生命周期。
 */

import type { AccountEventMap } from '@dailyuse/contracts/account';
import type { AuthEventMap } from '@dailyuse/contracts/authentication';
import { createTypedEventSubscriber, eventBus } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import type {
  IAuthIdentityRepository,
  IAuthSessionRepository,
} from '../../domain';
import { DisableIdentityForAccountCloseUseCase } from '../../application/use-cases/commands/disable-identity-for-account-close.use-case';
import type { AuthenticationModuleRuntimeContribution } from '..';

const logger = createLogger('AuthenticationRuntime');

const authenticationEventNames = [
  'auth:logged-in',
  'auth:logged-out',
  'auth:registered',
  'auth:password-changed',
  'auth:session-created',
  'auth:session-revoked',
] as const;

type AuthenticationObservedEventName = (typeof authenticationEventNames)[number];
type AuthenticationObservedEventMap = Pick<AuthEventMap, AuthenticationObservedEventName>;
type AuthenticationObservedEventHandler<K extends AuthenticationObservedEventName> = (
  payload: AuthenticationObservedEventMap[K],
) => void;

const authenticationEvents = createTypedEventSubscriber<AuthenticationObservedEventMap>(eventBus);
const accountEvents = createTypedEventSubscriber<AccountEventMap>(eventBus);

/**
 * Runtime contribution contract used by module transports.
 * 模块传输层使用的运行时贡献契约。
 */
export type AuthenticationRuntimeContribution = AuthenticationModuleRuntimeContribution;

/**
 * Logging-only subscribers for authentication domain events.
 * 认证领域事件的日志型订阅器。
 *
 * Note: Most event payloads are minimal — the aggregate ID is carried
 * by the event bus envelope, not the payload itself.
 */
const authenticationEventHandlers: {
  [K in AuthenticationObservedEventName]: AuthenticationObservedEventHandler<K>;
} = {
  'auth:logged-in': (payload) => {
    logger.info(`[Authentication] User logged in (method: ${payload.method})`);
  },
  'auth:logged-out': () => {
    logger.info('[Authentication] User logged out');
  },
  'auth:registered': (payload) => {
    logger.info(`[Authentication] User registered (email: ${payload.email})`);
  },
  'auth:password-changed': () => {
    logger.info('[Authentication] Password changed');
  },
  'auth:session-created': (payload) => {
    logger.info(`[Authentication] Session created (identity: ${String(payload.identityId)})`);
  },
  'auth:session-revoked': () => {
    logger.info('[Authentication] Session revoked');
  },
};

function subscribeAuthenticationEvent<K extends AuthenticationObservedEventName>(eventName: K): void {
  authenticationEvents.on(eventName, authenticationEventHandlers[eventName]);
}

function unsubscribeAuthenticationEvent<K extends AuthenticationObservedEventName>(
  eventName: K,
): void {
  authenticationEvents.off(eventName, authenticationEventHandlers[eventName]);
}

export interface CreateAuthenticationRuntimeContributionOptions {
  readonly identityRepository?: IAuthIdentityRepository;
  readonly sessionRepository?: IAuthSessionRepository;
}

/**
 * Creates an instance-owned runtime contribution.
 * 创建实例级 runtime 贡献对象。
 *
 * When identity/session repositories are provided, also cascades account:closed
 * into Auth disable + session revoke (Phase C).
 * 提供仓储时，将 account:closed 级联为 Auth disable + 撤 session（Phase C）。
 */
export function createAuthenticationRuntimeContribution(
  options: CreateAuthenticationRuntimeContributionOptions = {},
): AuthenticationRuntimeContribution {
  let started = false;
  const disableOnClose =
    options.identityRepository && options.sessionRepository
      ? new DisableIdentityForAccountCloseUseCase(
          options.identityRepository,
          options.sessionRepository,
        )
      : null;

  const onAccountClosed = async (payload: AccountEventMap['account:closed']) => {
    if (!disableOnClose) {
      return;
    }
    const identityId = String(payload.identityId);
    try {
      await disableOnClose.execute(identityId);
    } catch (error) {
      logger.error('[AuthenticationRuntime] Failed to cascade account:closed', {
        identityId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return {
    start(): void {
      if (started) {
        return;
      }

      for (const eventName of authenticationEventNames) {
        subscribeAuthenticationEvent(eventName);
      }
      if (disableOnClose) {
        accountEvents.on('account:closed', onAccountClosed);
      }
      started = true;
      logger.info('[AuthenticationRuntime] Authentication runtime started');
    },
    stop(): void {
      if (!started) {
        return;
      }

      for (const eventName of authenticationEventNames) {
        unsubscribeAuthenticationEvent(eventName);
      }
      if (disableOnClose) {
        accountEvents.off('account:closed', onAccountClosed);
      }
      started = false;
      logger.info('[AuthenticationRuntime] Authentication runtime stopped');
    },
  };
}
