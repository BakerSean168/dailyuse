/**
 * Repository API Initialization
 *
 * Registers container initialization task with the global InitializationManager.
 */

import {
  InitializationManager,
  InitializationPhase,
  createLogger,
  type InitializationTask,
} from '@dailyuse/utils';
import { RepositoryContainer } from '../infrastructure-server/di/repository-container-v2';

const logger = createLogger('RepositoryApiInitialization');

const repositoryContainerInitTask: InitializationTask = {
  name: 'repositoryContainerInit',
  phase: InitializationPhase.APP_STARTUP,
  priority: 25,
  initialize: async () => {
    RepositoryContainer.getInstance();
    logger.info('✓ Repository container initialized');
  },
};

export function registerRepositoryInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(repositoryContainerInitTask);
  logger.info('Repository initialization tasks registered');
}
