/**
 * AI Generation Task HTTP Adapter
 *
 * HTTP implementation of IAIGenerationTaskApiClient.
 */

import type { IAIGenerationTaskApiClient } from '../../ports/ai-generation-task-api-client.port';
import type { HttpClient } from '../../../shared/http-client.types';
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
 * AI Generation Task HTTP Adapter
 *
 * Implements IAIGenerationTaskApiClient using HTTP REST API calls.
 */
export class AIGenerationTaskHttpAdapter implements IAIGenerationTaskApiClient {
  private readonly baseUrl = '/ai/generation-tasks';

  constructor(private readonly httpClient: HttpClient) {}

  // ===== Generation Task CRUD =====

  async createGenerationTask(request: CreateGenerationTaskRequest): Promise<AIGenerationTaskClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getGenerationTasks(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
  }): Promise<GenerationTaskListResponse> {
    return this.httpClient.get(this.baseUrl, { params });
  }

  async getGenerationTaskById(uuid: string): Promise<AIGenerationTaskClientDTO> {
    return this.httpClient.get(`${this.baseUrl}/${uuid}`);
  }

  async cancelGenerationTask(uuid: string): Promise<void> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/cancel`);
  }

  async retryGenerationTask(uuid: string): Promise<AIGenerationTaskClientDTO> {
    return this.httpClient.post(`${this.baseUrl}/${uuid}/retry`);
  }

  // ===== Goal Generation =====

  async generateGoal(request: GenerateGoalRequest): Promise<GenerateGoalResponse> {
    return this.httpClient.post('/ai/generate/goal', request);
  }

  async generateGoalWithKeyResults(request: GenerateGoalWithKRsRequest): Promise<GenerateGoalWithKRsResponse> {
    return this.httpClient.post('/ai/generate/goal-with-key-results', request);
  }

  async generateKeyResults(goalUuid: string): Promise<GenerateKeyResultsResponse> {
    return this.httpClient.post(`/ai/generate/key-results/${goalUuid}`);
  }
}
