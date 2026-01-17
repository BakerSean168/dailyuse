import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { GoalContainer } from '../infrastructure/di/GoalContainer';
import { GoalEventPublisher, GoalTaskEventHandlers } from '@dailyuse/application-server/goal';

/**
 * Goal 模块初始化任务 - 事件发布器
 */
const goalEventHandlersInitTask: InitializationTask = {
  name: 'goalEventHandlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20, // 应用启动后期执行
  initialize: async () => {
    const container = GoalContainer.getInstance();
    await GoalEventPublisher.initialize(container.getGoalStatisticsApplicationService());
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
    const container = GoalContainer.getInstance();
    await handlers.initialize(container.getGoalRecordApplicationService());
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
