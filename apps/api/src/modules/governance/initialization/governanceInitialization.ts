import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

/**
 * Governance module initialization task - event handlers
 */
const governanceEventHandlersInitTask: InitializationTask = {
  name: 'governanceEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 30,
  initialize: async () => {
    console.log('✓ Governance event handlers initialized');
  },
};

/**
 * Governance module initialization task - background jobs
 */
const governanceJobsInitTask: InitializationTask = {
  name: 'governanceJobs',
  phase: InitializationPhase.APP_STARTUP,
  priority: 31,
  initialize: async () => {
    console.log('✓ Governance background jobs initialized');
  },
};

/**
 * Register Governance module initialization tasks
 */
export function registerGovernanceInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  manager.registerTask(governanceEventHandlersInitTask);
  manager.registerTask(governanceJobsInitTask);

  console.log('Governance module initialization tasks registered');
}
