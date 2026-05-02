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

import { createLogger, eventBus } from '@dailyuse/utils';
import type { AuthEventMap } from '@dailyuse/contracts/authentication';
import type { AuthenticationModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('AuthenticationRuntime');

type AuthEventName = keyof AuthEventMap;
type AuthEventHandler<K extends AuthEventName> = (payload: AuthEventMap[K]) => void;

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
const authenticationEventHandlers: Partial<{
  [K in AuthEventName]: AuthEventHandler<K>;
}> = {
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

/**
 * Creates an instance-owned runtime contribution.
 * 创建实例级 runtime 贡献对象。
 */
export function createAuthenticationRuntimeContribution(): AuthenticationRuntimeContribution {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      for (const [eventName, handler] of Object.entries(authenticationEventHandlers)) {
        (eventBus as any).on(eventName, handler);
      }

      started = true;
      logger.info('[Authentication] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      for (const [eventName, handler] of Object.entries(authenticationEventHandlers)) {
        (eventBus as any).off(eventName, handler);
      }

      started = false;
      logger.info('[Authentication] Runtime contribution stopped');
    },
  };
}
