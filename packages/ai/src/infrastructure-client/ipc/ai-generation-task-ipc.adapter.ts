/**
 * AI Generation Task IPC Adapter
 *
 * IPC implementation of IAIGenerationTaskApiClient for Electron desktop app.
 */

import type { IAIGenerationTaskApiClient } from '../../ports/ai-generation-task-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
import type {
  AIGenerationTaskClientDTO,
  GenerationTaskListResponse,
  CreateGenerationTaskRequest,
  GenerateGoalRequest,
  GenerateGoalResponse,
  GenerateGoalWithKRsRequest,
  GenerateGoalWithKRsResponse,
  GenerateKeyResultsResponse,
} from '@dailyuse/contracts/ai';

/**
 * AI Generation Task IPC Adapter
 *
 * Implements IAIGenerationTaskApiClient using Electron IPC.
 */
export class AIGenerationTaskIpcAdapter implements IAIGenerationTaskApiClient {
  private readonly channel = 'ai:generation-task';

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Generation Task CRUD =====

  async createGenerationTask(request: CreateGenerationTaskRequest): Promise<AIGenerationTaskClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:create`, request);
  }

  async getGenerationTasks(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
  }): Promise<GenerationTaskListResponse> {
    return this.ipcClient.invoke(`${this.channel}:list`, params);
  }

  async getGenerationTaskById(uuid: string): Promise<AIGenerationTaskClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:get`, uuid);
  }

  async cancelGenerationTask(uuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:cancel`, uuid);
  }

  async retryGenerationTask(uuid: string): Promise<AIGenerationTaskClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:retry`, uuid);
  }

  // ===== Goal Generation =====

  async generateGoal(request: GenerateGoalRequest): Promise<GenerateGoalResponse> {
    return this.ipcClient.invoke('ai:generate:goal', request);
  }

  async generateGoalWithKeyResults(request: GenerateGoalWithKRsRequest): Promise<GenerateGoalWithKRsResponse> {
    return this.ipcClient.invoke('ai:generate:goal-with-key-results', request);
  }

  async generateKeyResults(goalUuid: string): Promise<GenerateKeyResultsResponse> {
    return this.ipcClient.invoke('ai:generate:key-results', goalUuid);
  }
}
