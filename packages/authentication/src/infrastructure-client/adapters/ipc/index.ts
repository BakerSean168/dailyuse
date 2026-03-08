/**
 * Authentication IPC Adapters - Registration
 */

import type { IResultIpcClient } from '../types';
import { AuthIpcAdapter } from './auth-ipc.adapter';

export { AuthIpcAdapter, createAuthIpcAdapter } from './auth-ipc.adapter';

export interface AuthIpcAdapters {
  auth: AuthIpcAdapter;
}

export function createAuthIpcAdapters(ipcClient: IResultIpcClient): AuthIpcAdapters {
  return {
    auth: new AuthIpcAdapter(ipcClient),
  };
}
