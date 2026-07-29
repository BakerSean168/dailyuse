import type { Result } from '@memoflow/contracts/result';
import type { DashboardData } from '@memoflow/contracts/dashboard';
import { DashboardChannels } from '@memoflow/contracts/electron';
import type { IResultIpcClient } from '@memoflow/ipc-client';
import type { IDashboardApiClient } from '../types';

export class DashboardIpcAdapter implements IDashboardApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getDashboardStats(): Promise<Result<DashboardData>> {
    return this.ipcClient.invoke<DashboardData>(DashboardChannels.GET_STATS);
  }
}

export function createDashboardIpcAdapter(ipcClient: IResultIpcClient): DashboardIpcAdapter {
  return new DashboardIpcAdapter(ipcClient);
}
