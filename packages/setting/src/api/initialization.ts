/**
 * Setting Module Initialization Tasks
 *
 * 注册需要在应用启动时执行的初始化任务
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('SettingInit');

export function registerSettingInitializationTasks(): void {
  const initManager = InitializationManager.getInstance();

  initManager.registerTask({
    name: 'setting-module-startup',
    phase: InitializationPhase.APP_STARTUP,
    priority: 50,
    initialize: async () => {
      logger.info('Setting module initialized');
    },
  });
}
