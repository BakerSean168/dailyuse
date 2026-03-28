import type { AIAnalyticsQueryApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type { QueryAnalyticsReq, QueryAnalyticsRes } from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIAnalyticsQueryIpcAdapter implements AIAnalyticsQueryApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async queryAnalytics(request: QueryAnalyticsReq): Promise<QueryAnalyticsRes> {
    const result = await this.ipcClient.invoke<QueryAnalyticsRes>(AIChannels.ANALYTICS_QUERY, request);
    return unwrapResultOrThrow(result);
  }
}
