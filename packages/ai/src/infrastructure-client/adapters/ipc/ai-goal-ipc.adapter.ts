import type { IAIGoalApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type {
  GenerateGoalAutomationReq,
  GenerateGoalAutomationRes,
  GenerateGoalsReq,
  GenerateGoalsRes,
} from '@dailyuse/contracts/ai';

export class AIGoalIpcAdapter implements IAIGoalApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async generateGoal(request: GenerateGoalsReq): Promise<GenerateGoalsRes> {
    const result = await this.ipcClient.invoke<GenerateGoalsRes>(AIChannels.GOAL_GENERATE, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async automateGoal(request: GenerateGoalAutomationReq): Promise<GenerateGoalAutomationRes> {
    const result = await this.ipcClient.invoke<GenerateGoalAutomationRes>(
      AIChannels.GOAL_AUTOMATE,
      request,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
