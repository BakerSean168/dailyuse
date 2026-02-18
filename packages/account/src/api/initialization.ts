import {
  InitializationManager,
  InitializationPhase,
  createLogger,
  type InitializationTask,
} from '@dailyuse/utils';
import { AccountContainer } from '../infrastructure-server/di/account-container';
import { registerAccountEventListeners } from '../application-server/handlers';

const logger = createLogger('AccountApiInitialization');

const accountEventHandlersInitTask: InitializationTask = {
  name: 'accountEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 25,
  initialize: async () => {
    const accountRepository = AccountContainer.getInstance().getAccountRepository();
    registerAccountEventListeners(accountRepository);
    logger.info('✓ Account event handlers initialized');
  },
};

export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(accountEventHandlersInitTask);
  logger.info('Account initialization tasks registered');
}
