/**
 * AI Generation Task IPC Adapter
 *
 * IPC implementation of IAIGenerationTaskApiClient for Electron desktop app.
 */

import type {
  IIpcClient,
  IAIGenerationTaskApiClient,
  GenerationTaskListRes,
  CreateGenerationTaskReq,
  GenerateGoalReq,
  GenerateGoalRes,
  GenerateKeyResultsRes,
} from '../types';
import type {
  AIGenerationTaskClientDTO,
} from '@dailyuse/contracts/ai';

/**
 * AI Generation Task IPC Adapter
 *
 * Implements IAIGenerationTaskApiClient using Electron IPC.
 */
export class AIGenerationTaskIpcAdapter implements IAIGenerationTaskApiClient {
  private readonly channel = 'ai:generation-task';

  constructor(private readonly ipcClient: IIpcClient) {}

  // ===== Generation Task CRUD =====

  async createGenerationTask(request: CreateGenerationTaskReq): Promise<AIGenerationTaskClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getGenerationTasks(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
  }): Promise<GenerationTaskListRes> {
    return this.ipcClient.invoke(`${this.channel}:list`, params);
  }

  async getGenerationTaskById(id: string): Promise<AIGenerationTaskClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:get`, id);
  }

  async cancelGenerationTask(id: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:cancel`, id);
  }

  async retryGenerationTask(id: string): Promise<AIGenerationTaskClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:retry`, id);
  }

  // ===== Goal Generation =====

  async generateGoal(request: GenerateGoalReq): Promise<GenerateGoalRes> {
    return this.ipcClient.invoke('ai:generate:goal', request);
  }

  async generateGoalWithKeyResults(request: GenerateGoalReq): Promise<GenerateGoalRes> {
    return this.ipcClient.invoke('ai:generate:goal-with-key-results', request);
  }

  async generateKeyResults(goalId: string): Promise<GenerateKeyResultsRes> {
    return this.ipcClient.invoke('ai:generate:key-results', goalId);
  }
}
