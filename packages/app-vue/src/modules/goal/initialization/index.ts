/**
 * Goal 模块初始化任务
 *
 * 注册 Goal 模块的初始化任务到应用启动流程
 */

import {
  InitializationManager,
  InitializationPhase,
  createLogger,
  type InitializationTask,
} from '@dailyuse/utils';
import { useGoalStore } from '../stores/goalStore';

const logger = createLogger('goal:init');

/**
 * 注册 Goal 模块的初始化任务
 */
export function registerGoalInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  // TODO: Re-enable when dashboard module is migrated to app-vue
  // Widget registration requires @/modules/dashboard infrastructure and @dailyuse/contracts/dashboard
  // which are not yet available in the shared app-vue package.
  // import('../widgets/registerGoalWidgets').then(({ registerGoalWidgets }) => {
  //   registerGoalWidgets();
  // });

  // Goal 模块基础初始化任务
  const goalModuleInitTask: InitializationTask = {
    name: 'goal-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 20, // 在基础设施之后初始化
    initialize: async () => {
      logger.info('Starting goal module initialization');

      try {
        // Goal 模块初始化：注册 widgets、路由等
        logger.info('Goal module initialized');
      } catch (error) {
        logger.error('Goal module initialization failed', error);
        throw error;
      }
    },
    cleanup: async () => {
      logger.info('Cleaning up goal module data');

      try {
        const store = useGoalStore();
        store.$reset();
        logger.info('Goal module data cleaned up');
      } catch (error) {
        logger.error('Goal module cleanup failed', error);
      }
    },
  };

  // 用户登录时的 Goal 数据同步任务
  const goalUserDataSyncTask: InitializationTask = {
    name: 'goal-user-data-sync',
    phase: InitializationPhase.USER_LOGIN,
    priority: 15,
    initialize: async (context?: unknown) => {
      const ctx = context as { identityId?: string } | undefined;
      logger.info(`Syncing user goal data: ${ctx?.identityId || 'unknown'}`);

      try {
        // 用户登录后，Goal 数据将通过 composables 按需加载
        // 这里不做任何操作，保持懒加载策略
        logger.info('Goal data will be loaded on demand');
      } catch (error) {
        logger.error('User goal data sync failed', error);
        // 不抛出错误，允许其他模块继续初始化
      }
    },
    cleanup: async () => {
      logger.info('Cleaning up user goal data');

      try {
        const store = useGoalStore();
        store.$reset();
        logger.info('User goal data cleaned up');
      } catch (error) {
        logger.error('User goal data cleanup failed', error);
      }
    },
  };

  manager.registerTask(goalModuleInitTask);
  manager.registerTask(goalUserDataSyncTask);

  logger.info('Goal module initialization tasks registered');
}
