/**
 * createRepositoryPowerSyncModule — Desktop convenience factory.
 *
 * Knowledge repository connection/sync on Desktop is owned by Electron IPC
 * ports (local vault + knowledge sync). This factory returns a knowledge-only
 * module shell for hosts that still call it.
 */

import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IStoragePort } from '../application/ports/i-storage-port';
import {
  createRepositoryModule,
  type RepositoryModuleInstance,
  type RepositoryRuntimeContributionsInput,
} from './repository.module';

export interface CreateRepositoryPowerSyncModuleOptions {
  readonly storagePort: IStoragePort;
  readonly runtimeContributions?: RepositoryRuntimeContributionsInput;
  readonly autoCreateCanonicalRepository?: boolean;
}

/**
 * @deprecated Prefer Desktop knowledge IPC ports. Returns a knowledge-only
 * module shell without legacy database note CRUD.
 */
export function createRepositoryPowerSyncModule(
  _dbConnection: IElectronDatabase,
  options: CreateRepositoryPowerSyncModuleOptions,
): RepositoryModuleInstance {
  return createRepositoryModule({
    runtimeContributions: options.runtimeContributions,
  });
}
