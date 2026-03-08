import type { Result } from '@dailyuse/contracts/result';
import type { IDashboardApiClient, DashboardData } from '../types';

interface IResultHttpClient {
  get<T = unknown>(url: string): Promise<Result<T>>;
}

export class DashboardHttpAdapter implements IDashboardApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async getDashboardStats(): Promise<Result<DashboardData>> {
    return this.httpClient.get<DashboardData>('/dashboard/stats');
  }
}

export function createDashboardHttpAdapter(httpClient: IResultHttpClient): DashboardHttpAdapter {
  return new DashboardHttpAdapter(httpClient);
}
