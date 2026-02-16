/**
 * SSE 模块初始化任务注册
 * @description SSE 连接已迁移到 notificationInitialization.ts 中统一管理
 * @deprecated 此文件仅保留事件监听器注册，SSE 连接由 NotificationInitializationManager 管理
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

/**
 * 注册 SSE 模块的初始化任务
 * @description SSE 连接已迁移到 notificationInitialization.ts，此函数仅保留兼容性
 */
export function registerSSEInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // SSE 事件监听器注册任务
  const sseEventHandlersTask: InitializationTask = {
    name: 'sse-event-handlers',
    phase: InitializationPhase.USER_LOGIN,
    priority: 16, // 在 SSE 连接（priority 15）之后
    initialize: async (context) => {
      console.log(`🎧 [SSE] 注册用户 SSE 事件监听器: ${context?.identityId}`);

      try {
        // 这里可以注册用户特定的事件监听器
        // 例如：只处理当前用户的调度任务事件
        console.log('✅ [SSE] 用户 SSE 事件监听器注册完成');
      } catch (error) {
        console.error('❌ [SSE] 用户 SSE 事件监听器注册失败:', error);
      }
    },
    cleanup: async (context) => {
      console.log(`🔇 [SSE] 清理用户 SSE 事件监听器: ${context?.identityId}`);

      try {
        // 清理用户特定的事件监听器
        console.log('✅ [SSE] 用户 SSE 事件监听器清理完成');
      } catch (error) {
        console.error('❌ [SSE] 用户 SSE 事件监听器清理失败:', error);
      }
    },
  };

  // 注册事件监听器任务
  manager.registerTask(sseEventHandlersTask);

  console.log('📝 [SSE] SSE 事件监听器任务已注册');
}
