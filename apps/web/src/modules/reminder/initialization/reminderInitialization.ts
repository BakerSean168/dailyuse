/**
 * Reminder 模块初始化任务
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { useReminderStore } from '../presentation/stores/reminderStore';

/**
 * 注册 Reminder 模块的初始化任务
 */
export function registerReminderInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 🎨 立即注册 Dashboard Widgets（不等待初始化阶段）
  console.log('🎨 [Reminder] 注册 Reminder Widgets（立即执行）...');
  import('../presentation/widgets/registerReminderWidgets').then(({ registerReminderWidgets }) => {
    registerReminderWidgets();
    console.log('✅ [Reminder] Reminder Widgets 注册完成');
  });

  // Reminder 模块基础初始化任务
  const reminderModuleInitTask: InitializationTask = {
    name: 'reminder-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 30,
    initialize: async () => {
      console.log('📔 [Reminder] 开始初始化 Reminder 模块...');
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        console.log('✅ [Reminder] Reminder 模块初始化完成');
      } catch (error) {
        console.error('❌ [Reminder] Reminder 模块初始化失败:', error);
        console.warn('Reminder 模块初始化失败，但应用将继续启动');
      }
    },
    cleanup: async () => {
      console.log('🧹 [Reminder] 清理 Reminder 模块数据...');
      try {
        const store = useReminderStore();
        store.$reset();
        console.log('✅ [Reminder] Reminder 模块数据清理完成');
      } catch (error) {
        console.error('❌ [Reminder] Reminder 模块清理失败:', error);
      }
    },
  };

  // 用户登录时的 Reminder 数据同步任务
  const reminderUserDataSyncTask: InitializationTask = {
    name: 'reminder-user-data-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 20,
    initialize: async (context?: { accountUuid?: string }) => {
      console.log(`📔 [Reminder] 开始用户登录数据同步: ${context?.accountUuid || 'unknown'}`);
      try {
        console.log(`✅ [Reminder] Reminder 数据将按需加载`);
      } catch (error) {
        console.error(`❌ [Reminder] 用户登录数据同步失败:`, error);
        console.warn('Reminder 数据同步失败，但用户登录将继续');
      }
    },
    cleanup: async () => {
      console.log('🧹 [Reminder] 清理用户数据...');
      try {
        const store = useReminderStore();
        store.$reset();
        console.log('✅ [Reminder] 用户数据清理完成');
      } catch (error) {
        console.error('❌ [Reminder] 用户数据清理失败:', error);
      }
    },
  };

  manager.registerTask(reminderModuleInitTask);
  manager.registerTask(reminderUserDataSyncTask);

  console.log('📝 [Reminder] 初始化任务已注册');
}
