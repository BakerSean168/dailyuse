import type { AnalyticsQueryContext } from './analytics-query.port';

export interface IAnalyticsReadPort {
  buildContext(identityId: string, question: string): Promise<AnalyticsQueryContext>;
}
