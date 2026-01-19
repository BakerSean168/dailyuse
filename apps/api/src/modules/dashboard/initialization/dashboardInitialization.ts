import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { DashboardEventListener } from '../application/services/DashboardEventListener';

/**
 * Dashboard 模块初始化任务
 * 负责在应用启动时注册缓存失效监听器
 */
const dashboardEventListenersInitTask: InitializationTask = {
  name: 'dashboardEventListeners',
  phase: InitializationPhase.APP_STARTUP,
  priority: 35, // 在 Goal(20), Task(20), Reminder(20), Schedule(25) 之后初始化
  initialize: async () => {
    // 注册统计数据缓存失效监听器
    await DashboardEventListener.initialize();
    console.log('✓ Dashboard event listeners initialized');
  },
};

/**
 * 注册 Dashboard 模块的初始化任务
 */
export function registerDashboardInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 注册事件监听器初始化任务
  manager.registerTask(dashboardEventListenersInitTask);

  console.log('Dashboard module initialization tasks registered');
}
