/**
 * createRepositoryPowerSyncModule — convenience factory for PowerSync (Electron).
 * createRepositoryPowerSyncModule —— PowerSync（Electron）便捷工厂。
 *
 * Creates all PowerSync repository adapters, then delegates to the canonical
 * composition root `createRepositoryModule`.
 *
 * 创建所有 PowerSync 仓储适配器，然后委托给规范组合根 `createRepositoryModule`。
 */

import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IStoragePort } from '../application-server/ports/IStoragePort';
import {
  PowerSyncRepositoryRepository,
  PowerSyncResourceRepository,
  PowerSyncFolderRepository,
  ResourceBookmarkPowerSyncRepository,
} from './adapters/powersync';
import {
  createRepositoryModule,
  type RepositoryModuleInstance,
  type RepositoryRuntimeContributionsInput,
} from './repository.module';

// ---------------------------------------------------------------------------
// PowerSync module factory — PowerSync 模块工厂
// ---------------------------------------------------------------------------

export interface CreateRepositoryPowerSyncModuleOptions {
  readonly storagePort: IStoragePort;
  readonly runtimeContributions?: RepositoryRuntimeContributionsInput;
  readonly autoCreateCanonicalRepository?: boolean;
}

/**
 * Creates a fully-wired repository module backed by PowerSync adapters.
 * 创建基于 PowerSync 适配器的完整仓库模块。
 *
 * @param dbConnection - PowerSync database connection / PowerSync 数据库连接
 * @param options      - Storage port and optional runtime contributions / 存储端口和可选运行时贡献
 */
export function createRepositoryPowerSyncModule(
  dbConnection: IElectronDatabase,
  options: CreateRepositoryPowerSyncModuleOptions,
): RepositoryModuleInstance {
  const repositoryRepository = new PowerSyncRepositoryRepository(dbConnection);
  const resourceRepository = new PowerSyncResourceRepository(dbConnection);
  const folderRepository = new PowerSyncFolderRepository(dbConnection);
  const resourceBookmarkRepository = new ResourceBookmarkPowerSyncRepository(dbConnection);

  return createRepositoryModule({
    repositoryRepository,
    resourceRepository,
    folderRepository,
    resourceBookmarkRepository,
    storagePort: options.storagePort,
    runtimeContributions: options.runtimeContributions,
    autoCreateCanonicalRepository: options.autoCreateCanonicalRepository ?? false,
  });
}

// ---------------------------------------------------------------------------
// Re-exports — 重新导出
// ---------------------------------------------------------------------------

export {
  PowerSyncRepositoryRepository,
  PowerSyncResourceRepository,
  PowerSyncFolderRepository,
  ResourceBookmarkPowerSyncRepository,
};
