/**
 * Repository API Initialization
 * 仓库 API 初始化
 *
 * @deprecated The composition root (`createRepositoryModule`) now owns its own
 *             lifecycle via `start()` / `dispose()`. This file is kept only for
 *             backward compatibility with callers that import the function.
 *
 * @deprecated 组合根 (`createRepositoryModule`) 现在通过 `start()` / `dispose()`
 *             管理自身生命周期。此文件仅为向后兼容保留。
 *
 * @see {@link createRepositoryRuntimeContribution} in `./runtime.ts`
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RepositoryApiInitialization');

/**
 * @deprecated No-op stub. Use `createRepositoryRuntimeContribution()` instead.
 * @deprecated 空操作桩。请使用 `createRepositoryRuntimeContribution()` 代替。
 */
export function registerRepositoryInitializationTasks(): void {
  logger.info(
    'registerRepositoryInitializationTasks() is deprecated — lifecycle managed by composition root',
  );
}
