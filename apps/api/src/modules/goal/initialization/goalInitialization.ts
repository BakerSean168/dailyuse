import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { GoalEventPublisher } from '../application/services/GoalEventPublisher';
import { GoalTaskEventHandlers } from '../application/event-handlers/GoalTaskEventHandlers';

/**
 * Goal 模块初始化任务 - 事件发布器
 */
const goalEventHandlersInitTask: InitializationTask = {
  name: 'goalEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20, // 应用启动后期执行
  initialize: async () => {
    await GoalEventPublisher.initialize();
    console.log('✓ Goal event handlers initialized');
  },
};

/**
 * Goal 模块初始化任务 - Task 事件监听器
 */
const goalTaskEventHandlersInitTask: InitializationTask = {
  name: 'goalTaskEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 21, // 在事件发布器之后初始化
  initialize: async () => {
    const handlers = GoalTaskEventHandlers.getInstance();
    await handlers.initialize();
    console.log('✓ Goal module task event handlers initialized');
  },
};

/**
 * 注册 Goal 模块的初始化任务
 */
export function registerGoalInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 注册事件处理器初始化任务
  manager.registerTask(goalEventHandlersInitTask);
  
  // 注册 Task 事件监听器初始化任务
  manager.registerTask(goalTaskEventHandlersInitTask);

  console.log('Goal module initialization tasks registered');
}
