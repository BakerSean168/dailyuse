import type { IAIGoalApiClient, IResultHttpClient } from '../types';
import type { GenerateGoalsReq, GenerateGoalsRes } from '@memoflow/contracts/ai';
import type { Result } from '@memoflow/contracts/result';

/** HTTP adapter — returns Result, never throws (residual 98). */
export class AIGoalHttpAdapter implements IAIGoalApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async generateGoal(request: GenerateGoalsReq): Promise<Result<GenerateGoalsRes>> {
    return this.httpClient.post<GenerateGoalsRes>('/ai/generate/goal', request);
  }
}
