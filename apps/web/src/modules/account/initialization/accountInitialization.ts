/**
 * 账户模块初始化任务注册
 * Account Module Initialization Tasks
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
} from '@dailyuse/utils';

/**
 * 注册账户模块的所有初始化任务
 */
export function registerAccountInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // 1. 账户数据预加载任务（用户登录时）
  const accountDataPreloadTask: InitializationTask = {
    name: 'account-data-preload',
    phase: InitializationPhase.USER_LOGIN,
    priority: 10,
    initialize: async (context?: { accountUuid: string }) => {
      if (context?.accountUuid) {
        console.log(`🔄 [AccountModule] 预加载账户数据: ${context.accountUuid}`);
      }
    },
    cleanup: async () => {
      console.log('🧹 [AccountModule] 清理账户数据缓存');
    },
  };

  // 2. 账户状态同步任务（用户登录时）
  const accountStateSyncTask: InitializationTask = {
    name: 'account-state-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 20,
    dependencies: ['account-data-preload'],
    initialize: async (context?: { accountUuid: string }) => {
      if (context?.accountUuid) {
        console.log(`🔄 [AccountModule] 同步账户状态: ${context.accountUuid}`);
      }
    },
    cleanup: async () => {
      console.log('🧹 [AccountModule] 清理账户状态同步');
    },
  };

  // 注册所有任务
  manager.registerTask(accountDataPreloadTask);
  manager.registerTask(accountStateSyncTask);

  console.log('📝 [AccountModule] 所有初始化任务已注册');
}
