/**
 * Goal 模块初始化任务
 * 
 * 注册 Goal 模块的初始化任务到应用启动流程
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { useGoalStore } from '../presentation/stores/goalStore';

/**
 * 注册 Goal 模块的初始化任务
 */
export function registerGoalInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 🎨 立即注册 Dashboard Widgets（不等待初始化阶段）
  console.log('🎨 [Goal] 注册 Goal Widgets（立即执行）...');
  import('../presentation/widgets/registerGoalWidgets').then(({ registerGoalWidgets }) => {
    registerGoalWidgets();
    console.log('✅ [Goal] Goal Widgets 注册完成');
  });

  // Goal 模块基础初始化任务
  const goalModuleInitTask: InitializationTask = {
    name: 'goal-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 20, // 在基础设施之后初始化
    initialize: async () => {
      console.log('🎯 [Goal] 开始初始化 Goal 模块...');

      try {
        // Goal 模块初始化：注册 widgets、路由等
        console.log('✅ [Goal] Goal 模块初始化完成');
      } catch (error) {
        console.error('❌ [Goal] Goal 模块初始化失败:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('🧹 [Goal] 清理 Goal 模块数据...');

      try {
        const store = useGoalStore();
        store.$reset();
        console.log('✅ [Goal] Goal 模块数据清理完成');
      } catch (error) {
        console.error('❌ [Goal] Goal 模块清理失败:', error);
      }
    },
  };

  // 用户登录时的 Goal 数据同步任务
  const goalUserDataSyncTask: InitializationTask = {
    name: 'goal-user-data-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 15,
    initialize: async (context?: { accountUuid?: string }) => {
      console.log(`🔄 [Goal] 同步用户 Goal 数据: ${context?.accountUuid || 'unknown'}`);

      try {
        // 用户登录后，Goal 数据将通过 composables 按需加载
        // 这里不做任何操作，保持懒加载策略
        console.log('✅ [Goal] Goal 数据将按需加载');
      } catch (error) {
        console.error('❌ [Goal] 用户 Goal 数据同步失败:', error);
        // 不抛出错误，允许其他模块继续初始化
      }
    },
    cleanup: async () => {
      console.log('🧹 [Goal] 清理用户 Goal 数据...');

      try {
        const store = useGoalStore();
        store.$reset();
        console.log('✅ [Goal] 用户 Goal 数据清理完成');
      } catch (error) {
        console.error('❌ [Goal] 用户 Goal 数据清理失败:', error);
      }
    },
  };

  manager.registerTask(goalModuleInitTask);
  manager.registerTask(goalUserDataSyncTask);

  console.log('📝 [Goal] Goal 模块初始化任务已注册');
}
