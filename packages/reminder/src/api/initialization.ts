import {
  InitializationManager,
  InitializationPhase,
  createLogger,
  type InitializationTask,
} from '@dailyuse/utils';
import { ReminderContainer } from '../infrastructure-server/di/reminder-container';

const logger = createLogger('ReminderApiInitialization');

const reminderContainerInitTask: InitializationTask = {
  name: 'reminderContainerInit',
  phase: InitializationPhase.APP_STARTUP,
  priority: 25,
  initialize: async () => {
    ReminderContainer.getInstance();
    logger.info('✓ Reminder container initialized');
  },
};

export function registerReminderInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(reminderContainerInitTask);
  logger.info('Reminder initialization tasks registered');
}
