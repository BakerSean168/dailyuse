/**
 * Governance runtime contributions for server transports.
 * Governance 服务端传输层的运行时贡献。
 *
 * This file keeps side effects explicit and reversible.
 * Instead of globally registering initialization tasks, the governance module
 * now owns its event subscriptions through a small runtime object.
 *
 * 这个文件让副作用显式且可逆。
 * governance 不再通过全局初始化任务注册监听器，而是通过一个轻量的
 * runtime 对象管理自身事件订阅生命周期。
 */

import { eventBus } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import type { GovernanceEventMap } from '../contracts/protocol/governance-event-map';
import type { GovernanceModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('GovernanceRuntime');

type GovernanceEventName = keyof GovernanceEventMap;
type GovernanceEventHandler<K extends GovernanceEventName> = (
  payload: GovernanceEventMap[K],
) => void;

/**
 * Runtime contribution contract used by module transports.
 * 模块传输层使用的运行时贡献契约。
 */
export type GovernanceRuntimeContribution = GovernanceModuleRuntimeContribution;

/**
 * Logging-only subscribers for governance domain events.
 * 治理领域事件的日志型订阅器。
 */
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
  eventBus.on(eventName, governanceEventHandlers[eventName]);
}

function unsubscribeGovernanceEvent<K extends GovernanceEventName>(eventName: K): void {
  eventBus.off(eventName, governanceEventHandlers[eventName]);
}

/**
 * Creates an instance-owned runtime contribution.
 * 创建实例级 runtime 贡献对象。
  * @returns any - 
 */
export function createGovernanceRuntimeContribution(): GovernanceRuntimeContribution {
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
      logger.info('[Governance] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      for (const eventName of governanceEventNames) {
        unsubscribeGovernanceEvent(eventName);
      }

      started = false;
      logger.info('[Governance] Runtime contribution stopped');
    },
  };
}
