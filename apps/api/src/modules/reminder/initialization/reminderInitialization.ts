import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { ReminderEventHandler } from '../application/event-handlers/ReminderEventHandler';

/**
 * Reminder 模块初始化任务 - 事件桥接器
 */
const reminderEventHandlersInitTask: InitializationTask = {
  name: 'reminderEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20,
  initialize: async () => {
    await ReminderEventHandler.initialize();
    console.log('✓ Reminder event handlers initialized');
  },
};

/**
 * 注册 Reminder 模块的初始化任务
 */
export function registerReminderInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(reminderEventHandlersInitTask);
  console.log('Reminder module initialization tasks registered');
}
