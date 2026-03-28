import type { AIAnalyticsQueryApiClient, IResultHttpClient } from '../types';
import type { QueryAnalyticsReq, QueryAnalyticsRes } from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIAnalyticsQueryHttpAdapter implements AIAnalyticsQueryApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async queryAnalytics(request: QueryAnalyticsReq): Promise<QueryAnalyticsRes> {
    const result = await this.httpClient.post<QueryAnalyticsRes>('/ai/analytics/query', request);
    return unwrapResultOrThrow(result);
  }
}
