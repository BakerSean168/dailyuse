/**
 * Account IPC Adapters - Registration
 */

import type { IIpcClient } from '../types';
import { AccountIpcAdapter } from './account-ipc.adapter';

export { AccountIpcAdapter, createAccountIpcAdapter } from './account-ipc.adapter';

export interface AccountIpcAdapters {
  account: AccountIpcAdapter;
}

export function createAccountIpcAdapters(ipcClient: IIpcClient): AccountIpcAdapters {
  return {
    account: new AccountIpcAdapter(ipcClient),
  };
}
