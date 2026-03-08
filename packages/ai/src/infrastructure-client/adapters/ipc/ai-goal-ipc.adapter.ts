import type { IAIGoalApiClient, IResultIpcClient } from '../types';
import type { GenerateGoalsReq, GenerateGoalsRes } from '@dailyuse/contracts/ai';

export class AIGoalIpcAdapter implements IAIGoalApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async generateGoal(request: GenerateGoalsReq): Promise<GenerateGoalsRes> {
    const result = await this.ipcClient.invoke<GenerateGoalsRes>('ai:goal:generate', request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
