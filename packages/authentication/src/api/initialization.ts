/**
 * @deprecated This file is deprecated. Use `createAuthenticationRuntimeContribution()` from `./runtime` instead.
 * 已废弃：请使用 `./runtime` 中的 `createAuthenticationRuntimeContribution()` 代替。
 *
 * The old initialization task pattern registered event handlers via a global
 * InitializationManager singleton. The new pattern uses module-owned runtime
 * contributions with explicit start()/stop() lifecycle.
 *
 * 旧的初始化任务模式通过全局 InitializationManager 单例注册事件处理器。
 * 新模式使用模块自有的运行时贡献对象，具有显式的 start()/stop() 生命周期。
 *
 * This file is kept for backward compatibility only. It is no longer called
 * by the canonical API module.
 */

import {
  InitializationManager,
  InitializationPhase,
  type InitializationTask,
  createLogger,
} from '@dailyuse/utils';

const logger = createLogger('AuthenticationInit');

const authenticationEventHandlersInitTask: InitializationTask = {
  name: 'authentication:event-handlers',
  phase: InitializationPhase.APP_STARTUP,
  priority: 20,
  initialize: async () => {
    logger.info('[Authentication] Event handlers initialized (legacy path)');
  },
  cleanup: async () => {
    logger.info('[Authentication] Cleaning up event handlers (legacy path)...');
    logger.info('[Authentication] Event handlers cleaned up');
  },
};

/**
 * @deprecated Use `createAuthenticationRuntimeContribution()` instead.
 * 已废弃：请使用 `createAuthenticationRuntimeContribution()` 代替。
 */
export function registerAuthenticationInitializationTasks(): void {
  const manager = InitializationManager.getInstance();
  manager.registerTask(authenticationEventHandlersInitTask);
  logger.warn(
    '[Authentication] registerAuthenticationInitializationTasks() is deprecated. ' +
      'Use createAuthenticationRuntimeContribution() from api/runtime.ts instead.',
  );
}
