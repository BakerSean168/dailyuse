import type { AIAnalyticsQueryApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type { QueryAnalyticsReq, QueryAnalyticsRes } from '@dailyuse/contracts/ai';
import type { Result } from '@dailyuse/contracts/result';

/** IPC adapter — returns Result, never throws (residual 98). */
export class AIAnalyticsQueryIpcAdapter implements AIAnalyticsQueryApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async queryAnalytics(request: QueryAnalyticsReq): Promise<Result<QueryAnalyticsRes>> {
    return this.ipcClient.invoke<QueryAnalyticsRes>(AIChannels.ANALYTICS_QUERY, request);
  }
}
