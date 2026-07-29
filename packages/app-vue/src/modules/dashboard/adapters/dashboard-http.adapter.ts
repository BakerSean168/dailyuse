import type { Result } from '@memoflow/contracts/result';
import type { DashboardData } from '@memoflow/contracts/dashboard';
import type { IResultHttpClient } from '@memoflow/http-client';
import type { IDashboardApiClient } from '../types';

export class DashboardHttpAdapter implements IDashboardApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async getDashboardStats(): Promise<Result<DashboardData>> {
    return this.httpClient.get<DashboardData>('/dashboard/stats');
  }
}

export function createDashboardHttpAdapter(httpClient: IResultHttpClient): DashboardHttpAdapter {
  return new DashboardHttpAdapter(httpClient);
}
