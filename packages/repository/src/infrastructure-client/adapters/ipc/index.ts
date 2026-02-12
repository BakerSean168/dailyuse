/**
 * Repository IPC Adapters - Registration
 */

import type { IIpcClient } from '../types';
import { RepositoryIpcAdapter } from './repository-ipc.adapter';

export { RepositoryIpcAdapter } from './repository-ipc.adapter';

export interface RepositoryIpcAdapters {
  repository: RepositoryIpcAdapter;
}

export function createRepositoryIpcAdapters(ipcClient: IIpcClient): RepositoryIpcAdapters {
  return { repository: new RepositoryIpcAdapter(ipcClient) };
}
