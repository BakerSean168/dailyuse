/**
 * Repository runtime contributions for server transports.
 * Repository 服务端传输层的运行时贡献。
 *
 * This file keeps side effects explicit and reversible.
 * Instead of globally registering initialization tasks via InitializationManager,
 * the repository module now owns its container lifecycle through a small runtime
 * object passed as a dependency.
 *
 * 这个文件让副作用显式且可逆。
 * repository 不再通过全局 InitializationManager 注册初始化任务，
 * 而是通过一个轻量的 runtime 对象管理自身容器的生命周期。
 */

import { createLogger } from '@dailyuse/utils';
import type { RepositoryModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('RepositoryRuntime');

/**
 * Runtime contribution contract used by module transports.
 * 模块传输层使用的运行时贡献契约。
 */
export type RepositoryRuntimeContribution = RepositoryModuleRuntimeContribution;

/**
 * Creates an instance-owned runtime contribution.
 * 创建实例级 runtime 贡献对象。
 *
 * Replaces the old `registerRepositoryInitializationTasks()` that relied on
 * global `InitializationManager` singleton. Now the module controls its own
 * lifecycle through start/stop.
 *
 * 替代了旧的依赖全局 InitializationManager 单例的
 * registerRepositoryInitializationTasks()。
 * 现在模块通过 start/stop 控制自己的生命周期。
 */
export function createRepositoryRuntimeContribution(): RepositoryRuntimeContribution {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      started = true;
      logger.info('[Repository] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      started = false;
      logger.info('[Repository] Runtime contribution stopped');
    },
  };
}
