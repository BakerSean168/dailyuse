import type { IAIGoalApiClient, IResultHttpClient } from '../types';
import type {
  GenerateGoalAutomationReq,
  GenerateGoalAutomationRes,
  GenerateGoalsReq,
  GenerateGoalsRes,
} from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIGoalHttpAdapter implements IAIGoalApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async generateGoal(request: GenerateGoalsReq): Promise<GenerateGoalsRes> {
    const result = await this.httpClient.post<GenerateGoalsRes>('/ai/generate/goal', request);
    return unwrapResultOrThrow(result);
  }

  async automateGoal(request: GenerateGoalAutomationReq): Promise<GenerateGoalAutomationRes> {
    const result = await this.httpClient.post<GenerateGoalAutomationRes>(
      '/ai/generate/goal-automation',
      request,
    );
    return unwrapResultOrThrow(result);
  }
}
