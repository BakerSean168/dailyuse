import type { IAIGoalApiClient, IResultHttpClient } from '../types';
import type { GenerateGoalsReq, GenerateGoalsRes } from '@dailyuse/contracts/ai';

export class AIGoalHttpAdapter implements IAIGoalApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async generateGoal(request: GenerateGoalsReq): Promise<GenerateGoalsRes> {
    const result = await this.httpClient.post<GenerateGoalsRes>('/ai/generate/goal', request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
