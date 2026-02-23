/**
 * Governance Module Initialization Tasks
 *
 * 注册事件处理器和后台任务到 InitializationManager。
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  createLogger,
  eventBus,
} from '@dailyuse/utils';
import type { GovernanceEventMap } from '../contracts/protocol/governance-event-map';

const logger = createLogger('GovernanceInit');

const governanceEventHandlers: {
  [K in keyof GovernanceEventMap]: (payload: GovernanceEventMap[K]) => void;
} = {
  'governance:rule-created': (payload) => {
    logger.info(`[Governance] Rule created: ${payload.code}`);
  },
  'governance:rule-updated': (payload) => {
    logger.info(`[Governance] Rule updated: ${payload.code}`);
  },
  'governance:rule-deprecated': (payload) => {
    logger.warn(`[Governance] Rule deprecated: ${payload.code}`);
  },
  'governance:rule-reactivated': (payload) => {
    logger.info(`[Governance] Rule reactivated: ${payload.code}`);
  },
  'governance:rule-status-changed': (payload) => {
    logger.info(
      `[Governance] Rule status changed: ${payload.code} (${payload.previousStatus} → ${payload.newStatus})`,
    );
  },
};

const governanceEventHandlersInitTask: InitializationTask = {
  name: 'governanceEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 30,
  initialize: async () => {
    for (const [eventName, handler] of Object.entries(governanceEventHandlers)) {
      eventBus.on(eventName as keyof GovernanceEventMap, handler as (payload: GovernanceEventMap[keyof GovernanceEventMap]) => void);
    }
    logger.info('[Governance] Event handlers initialized');
  },
  cleanup: async () => {
    for (const [eventName, handler] of Object.entries(governanceEventHandlers)) {
      eventBus.off(eventName as keyof GovernanceEventMap, handler as (payload: GovernanceEventMap[keyof GovernanceEventMap]) => void);
    }
    logger.info('[Governance] Event handlers cleaned up');
  },
};

const governanceJobsInitTask: InitializationTask = {
  name: 'governanceJobs',
  phase: InitializationPhase.APP_STARTUP,
  priority: 31,
  initialize: async () => {
    logger.info('[Governance] Background jobs initialized');
  },
  cleanup: async () => {
    logger.info('[Governance] Background jobs cleaned up');
  },
};

export function registerGovernanceInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(governanceEventHandlersInitTask);
  manager.registerTask(governanceJobsInitTask);
  logger.info('[Governance] Initialization tasks registered');
}
