/**
 * @memoflow/repository
 *
 * Public repository contracts stay centralized in
 * `@memoflow/contracts/repository`.
 * Root exports are limited to the canonical server composition roots.
 * Client / API / Electron seams use dedicated subpaths.
 */

export {
  createFsStorageAdapter,
  createRepositoryModule,
  createRepositoryPrismaModule,
  createRepositoryRuntimeContribution,
  resolveRepositoryStorageBaseDir,
  DEFAULT_REPOSITORY_STORAGE_BASE_DIR,
  type CreateRepositoryPrismaModuleOptions,
  type ResolveRepositoryStorageBaseDirOptions,
  type RepositoryModuleDependencies,
  type RepositoryModuleInstance,
  type RepositoryModuleRuntimeContribution,
} from './server';
export type { RepositoryApplicationPort } from './server';
