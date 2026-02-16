/**
 * AI Generation Task HTTP Adapter
 *
 * HTTP implementation of IAIGenerationTaskApiClient.
 */

import type { IHttpClient, IAIGenerationTaskApiClient } from '../types';
import type {
  AIGenerationTaskClientDTO,
  GenerationTaskListRes,
  CreateGenerationTaskReq,
  GenerateGoalReq,
  GenerateGoalRes,
  GenerateKeyResultsRes,
} from '@dailyuse/contracts/ai';

/**
 * AI Generation Task HTTP Adapter
 *
 * Implements IAIGenerationTaskApiClient using HTTP REST API calls.
 */
export class AIGenerationTaskHttpAdapter implements IAIGenerationTaskApiClient {
  private readonly baseUrl = '/ai/generation-tasks';

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== Generation Task CRUD =====

  async createGenerationTask(request: CreateGenerationTaskReq): Promise<AIGenerationTaskClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getGenerationTasks(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
  }): Promise<GenerationTaskListRes> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getGenerationTaskById(id: string): Promise<AIGenerationTaskClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${id}`);
  }

  async cancelGenerationTask(id: string): Promise<void> {
    return this.httpClient.post(`${this.baseUrl}/${id}/cancel`);
  }

  async retryGenerationTask(id: string): Promise<AIGenerationTaskClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${id}/retry`);
  }

  // ===== Goal Generation =====

  async generateGoal(request: GenerateGoalReq): Promise<GenerateGoalRes> {
    return this.httpClient.post('/ai/generate/goal', request);
  }

  async generateGoalWithKeyResults(request: GenerateGoalReq): Promise<GenerateGoalRes> {
    return this.httpClient.post('/ai/generate/goal-with-key-results', request);
  }

  async generateKeyResults(goalId: string): Promise<GenerateKeyResultsRes> {
    return this.httpClient.post(`/ai/generate/key-results/${goalId}`);
  }
}
