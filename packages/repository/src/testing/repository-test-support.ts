/**
 * Repository test helpers for residual knowledge-runtime unit tests.
 *
 * Legacy in-memory Folder/Resource/Bookmark repositories are no longer assembled
 * into the application runtime. Prefer knowledge service fakes in unit tests.
 */

import { createRepositoryModule } from '../server/infrastructure/repository.module';
import type { RepositoryModuleInstance } from '../server/infrastructure/repository.module';

/**
 * Returns a knowledge-only repository module shell for residual tests.
 */
export function createRepositoryModuleForTests(): {
  readonly module: RepositoryModuleInstance;
} {
  return {
    module: createRepositoryModule({}),
  };
}
