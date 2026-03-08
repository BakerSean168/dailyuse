import type { Result } from '@dailyuse/contracts/result';
import type { IDashboardApiClient, DashboardData } from '../types';

interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

export class DashboardIpcAdapter implements IDashboardApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getDashboardStats(): Promise<Result<DashboardData>> {
    return this.ipcClient.invoke<DashboardData>('dashboard:get-stats');
  }
}

export function createDashboardIpcAdapter(ipcClient: IResultIpcClient): DashboardIpcAdapter {
  return new DashboardIpcAdapter(ipcClient);
}
