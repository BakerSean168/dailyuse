import type { AIEvaluationReportApiClient, IResultHttpClient } from '../types';
import type {
  GetAIEvaluationOverviewReq,
  GetAIEvaluationOverviewRes,
} from '@dailyuse/contracts/ai';

export class AIEvaluationReportHttpAdapter implements AIEvaluationReportApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async getEvaluationOverview(
    request: GetAIEvaluationOverviewReq = {},
  ): Promise<GetAIEvaluationOverviewRes> {
    const params = new URLSearchParams();
    if (typeof request.historyLimit === 'number') {
      params.set('historyLimit', String(request.historyLimit));
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    const result = await this.httpClient.get<GetAIEvaluationOverviewRes>(
      `/ai/evaluations/overview${suffix}`,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
