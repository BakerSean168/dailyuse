/**
 * Governance event-log runtime adapter.
 * Governance 事件日志运行时适配器。
 *
 * Owns reversible event-bus subscriptions for module-local diagnostics.
 * 模块级诊断事件订阅的可逆运行时适配器。
 */

import { createTypedEventSubscriber, eventBus } from '@memoflow/utils/domain';
import { createLogger } from '@memoflow/utils/logger';
import type { GovernanceEventMap } from '@memoflow/contracts/governance';
import type { GovernanceRuntimeAdapter } from './module-runtime';

const logger = createLogger('GovernanceRuntime');
const governanceEvents = createTypedEventSubscriber<GovernanceEventMap>(eventBus);

type GovernanceEventName = keyof GovernanceEventMap;
type GovernanceEventHandler<K extends GovernanceEventName> = (
  payload: GovernanceEventMap[K],
) => void;

const governanceEventHandlers: {
  [K in GovernanceEventName]: GovernanceEventHandler<K>;
} = {
  'governance:rule-created': (payload) => {
    logger.info(`[Governance] Rule created: ${payload.code}`);
  },
  'governance:rule-updated': (payload) => {
    logger.info(`[Governance] Rule updated: ${payload.ruleId}`);
  },
  'governance:rule-deprecated': (payload) => {
    logger.warn(`[Governance] Rule deprecated: ${payload.code}`);
  },
  'governance:rule-reactivated': (payload) => {
    logger.info(`[Governance] Rule reactivated: ${payload.code}`);
  },
  'governance:rule-status-changed': (payload) => {
    logger.info(
      `[Governance] Rule status changed: ${payload.code} (${payload.previousStatus} -> ${payload.newStatus})`,
    );
  },
  'governance:rule-severity-changed': (payload) => {
    logger.info(
      `[Governance] Rule severity changed: ${payload.code} (${payload.previousSeverity} -> ${payload.newSeverity})`,
    );
  },
  'governance:rule-deleted': (payload) => {
    logger.warn(`[Governance] Rule deleted: ${payload.code}`);
  },
};

const governanceEventNames = [
  'governance:rule-created',
  'governance:rule-updated',
  'governance:rule-deprecated',
  'governance:rule-reactivated',
  'governance:rule-status-changed',
  'governance:rule-severity-changed',
  'governance:rule-deleted',
] as const satisfies readonly GovernanceEventName[];

function subscribeGovernanceEvent<K extends GovernanceEventName>(eventName: K): void {
  governanceEvents.on(eventName, governanceEventHandlers[eventName]);
}

function unsubscribeGovernanceEvent<K extends GovernanceEventName>(eventName: K): void {
  governanceEvents.off(eventName, governanceEventHandlers[eventName]);
}

/**
 * Creates the governance event-log runtime adapter.
 * 创建治理事件日志 runtime 适配器。
 *
 * @returns Instance-owned runtime adapter with reversible subscriptions.
 */
export function createGovernanceEventLogRuntime(): GovernanceRuntimeAdapter {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      for (const eventName of governanceEventNames) {
        subscribeGovernanceEvent(eventName);
      }

      started = true;
      logger.info('[Governance] Runtime adapter started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      for (const eventName of governanceEventNames) {
        unsubscribeGovernanceEvent(eventName);
      }

      started = false;
      logger.info('[Governance] Runtime adapter stopped');
    },
  };
}