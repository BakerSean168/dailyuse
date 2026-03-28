import { AIChannels } from '@dailyuse/contracts/electron';
import type {
  GetAIEvaluationOverviewReq,
  GetAIEvaluationOverviewRes,
} from '@dailyuse/contracts/ai';
import type { AIEvaluationReportApiClient, IResultIpcClient } from '../types';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIEvaluationReportIpcAdapter implements AIEvaluationReportApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getEvaluationOverview(
    request: GetAIEvaluationOverviewReq = {},
  ): Promise<GetAIEvaluationOverviewRes> {
    const result = await this.ipcClient.invoke<GetAIEvaluationOverviewRes>(
      AIChannels.EVALUATION_OVERVIEW_GET,
      request,
    );
    return unwrapResultOrThrow(result);
  }
}
