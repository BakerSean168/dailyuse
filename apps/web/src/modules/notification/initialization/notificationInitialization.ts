/**
 * Notification 模块初始化任务注册
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';
import { useNotificationStore } from '../presentation/stores/notificationStore';

export function registerNotificationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  const notificationInitTask: InitializationTask = {
    name: 'notification-core',
    phase: InitializationPhase.USER_LOGIN,
    priority: 10,
    initialize: async () => {
      console.log('🔔 [Notification] 开始初始化通知核心服务...');
      try {
        console.log('✅ [Notification] 通知核心服务初始化完成');
      } catch (error) {
        console.error('❌ [Notification] 通知核心服务初始化失败:', error);
        throw error;
      }
    },
    cleanup: async () => {
      console.log('🧹 [Notification] 清理通知核心服务...');
      try {
        const store = useNotificationStore();
        store.$reset();
        console.log('✅ [Notification] 通知核心服务清理完成');
      } catch (error) {
        console.error('❌ [Notification] 通知核心服务清理失败:', error);
      }
    },
  };

  manager.registerTask(notificationInitTask);

  console.log('📝 [Notification] 通知模块初始化任务已注册');
}
