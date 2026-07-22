import type { Result } from '@dailyuse/contracts/result';
import { DashboardChannels } from '@dailyuse/contracts/electron';
import type { IDashboardApiClient } from '../types';
import type { DashboardData } from '@dailyuse/contracts/dashboard';

interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

export class DashboardIpcAdapter implements IDashboardApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getDashboardStats(): Promise<Result<DashboardData>> {
    return this.ipcClient.invoke<DashboardData>(DashboardChannels.GET_STATS);
  }
}

export function createDashboardIpcAdapter(ipcClient: IResultIpcClient): DashboardIpcAdapter {
  return new DashboardIpcAdapter(ipcClient);
}
