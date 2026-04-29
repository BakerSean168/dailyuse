import type { IAIGoalApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type { GenerateGoalsReq, GenerateGoalsRes } from '@dailyuse/contracts/ai';
import { unwrapResultOrThrow } from '../result-client-error';

export class AIGoalIpcAdapter implements IAIGoalApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async generateGoal(request: GenerateGoalsReq): Promise<GenerateGoalsRes> {
    const result = await this.ipcClient.invoke<GenerateGoalsRes>(AIChannels.GOAL_GENERATE, request);
    return unwrapResultOrThrow(result);
  }
}
