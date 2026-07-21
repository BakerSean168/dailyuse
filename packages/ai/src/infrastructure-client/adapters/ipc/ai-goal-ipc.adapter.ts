import type { IAIGoalApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type { GenerateGoalsReq, GenerateGoalsRes } from '@dailyuse/contracts/ai';
import type { Result } from '@dailyuse/contracts/result';

/** IPC adapter — returns Result, never throws (residual 98). */
export class AIGoalIpcAdapter implements IAIGoalApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async generateGoal(request: GenerateGoalsReq): Promise<Result<GenerateGoalsRes>> {
    return this.ipcClient.invoke<GenerateGoalsRes>(AIChannels.GOAL_GENERATE, request);
  }
}
