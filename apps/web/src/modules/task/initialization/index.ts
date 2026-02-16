/**
 * Task 模块初始化任务
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { useTaskStore } from '../presentation/stores/taskStore';

/**
 * 注册 Task 模块的初始化任务
 */
export function registerTaskInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 🎨 立即注册 Dashboard Widgets（不等待初始化阶段）
  console.log('🎨 [Task] 注册 Task Widgets（立即执行）...');
  import('../presentation/widgets/registerTaskWidgets').then(({ registerTaskWidgets }) => {
    registerTaskWidgets();
    console.log('✅ [Task] Task Widgets 注册完成');
  });

  // Task 模块基础初始化任务
  const taskModuleInitTask: InitializationTask = {
    name: 'task-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 25,
    initialize: async () => {
      console.log('📋 [Task] 开始初始化 Task 模块...');
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log('✅ [Task] Task 模块初始化完成');
      } catch (error) {
        console.error('❌ [Task] Task 模块初始化失败:', error);
        console.warn('Task 模块初始化失败，但应用将继续启动');
      }
    },
    cleanup: async () => {
      console.log('🧹 [Task] 清理 Task 模块数据...');
      try {
        const store = useTaskStore();
        store.$reset();
        console.log('✅ [Task] Task 模块数据清理完成');
      } catch (error) {
        console.error('❌ [Task] Task 模块清理失败:', error);
      }
    },
  };

  // 用户登录时的 Task 数据同步任务
  const taskUserDataSyncTask: InitializationTask = {
    name: 'task-user-data-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 20,
    initialize: async (context?: { identityId?: string }) => {
      console.log(`🔄 [Task] 同步用户 Task 数据: ${context?.identityId || 'unknown'}`);
      try {
        console.log('✅ [Task] Task 数据将按需加载');
      } catch (error) {
        console.error('❌ [Task] 用户 Task 数据同步失败:', error);
      }
    },
    cleanup: async () => {
      console.log('🧹 [Task] 清理用户 Task 数据...');
      try {
        const store = useTaskStore();
        store.$reset();
        console.log('✅ [Task] 用户 Task 数据清理完成');
      } catch (error) {
        console.error('❌ [Task] 用户 Task 数据清理失败:', error);
      }
    },
  };

  manager.registerTask(taskModuleInitTask);
  manager.registerTask(taskUserDataSyncTask);

  console.log('✅ [Task] 已注册 Task 模块初始化任务');
}
