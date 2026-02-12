/**
 * Governance Module Initialization Tasks
 *
 * 注册事件处理器和后台任务到 InitializationManager。
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

const governanceEventHandlersInitTask: InitializationTask = {
  name: 'governanceEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 30,
  initialize: async () => {
    console.log('✓ Governance event handlers initialized');
  },
};

const governanceJobsInitTask: InitializationTask = {
  name: 'governanceJobs',
  phase: InitializationPhase.APP_STARTUP,
  priority: 31,
  initialize: async () => {
    console.log('✓ Governance background jobs initialized');
  },
};

export function registerGovernanceInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(governanceEventHandlersInitTask);
  manager.registerTask(governanceJobsInitTask);
  console.log('Governance module initialization tasks registered');
}
