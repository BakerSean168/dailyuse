import { AIChannels } from '@dailyuse/contracts/electron';
import type {
  GetAIEvaluationOverviewReq,
  GetAIEvaluationOverviewRes,
} from '@dailyuse/contracts/ai';
import type { Result } from '@dailyuse/contracts/result';
import type { AIEvaluationReportApiClient, IResultIpcClient } from '../types';

/** IPC adapter — returns Result, never throws (residual 98). */
export class AIEvaluationReportIpcAdapter implements AIEvaluationReportApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getEvaluationOverview(
    request: GetAIEvaluationOverviewReq = {},
  ): Promise<Result<GetAIEvaluationOverviewRes>> {
    return this.ipcClient.invoke<GetAIEvaluationOverviewRes>(
      AIChannels.EVALUATION_OVERVIEW_GET,
      request,
    );
  }
}
