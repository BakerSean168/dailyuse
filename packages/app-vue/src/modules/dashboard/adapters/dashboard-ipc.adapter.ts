import type { Result } from '@dailyuse/contracts/result';
import type { DashboardData } from '@dailyuse/contracts/dashboard';
import { DashboardChannels } from '@dailyuse/contracts/electron';
import type { IResultIpcClient } from '@dailyuse/ipc-client';
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
