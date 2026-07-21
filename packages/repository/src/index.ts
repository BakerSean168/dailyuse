/**
 * @dailyuse/repository
 *
 * Public repository contracts stay centralized in
 * `@dailyuse/contracts/repository`.
 * Root exports are limited to the canonical server composition roots.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createFsStorageAdapter,
  createRepositoryModule,
  createRepositoryPrismaModule,
  createRepositoryPowerSyncModule,
  createRepositoryRuntimeContribution,
  resolveRepositoryStorageBaseDir,
  DEFAULT_REPOSITORY_STORAGE_BASE_DIR,
  type CreateRepositoryPrismaModuleOptions,
  type CreateRepositoryPowerSyncModuleOptions,
  type ResolveRepositoryStorageBaseDirOptions,
  type RepositoryModuleDependencies,
  type RepositoryModuleInstance,
  type RepositoryModuleRuntimeContribution,
  type RepositoryRuntimeContribution,
} from './server';
export type { RepositoryApplicationPort } from './server';
