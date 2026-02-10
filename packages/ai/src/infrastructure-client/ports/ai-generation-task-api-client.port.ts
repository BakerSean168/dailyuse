/**
 * AI Generation Task API Client Port Interface
 *
 * Defines the contract for AI Generation Task API operations.
 * Implementations: AIGenerationTaskHttpAdapter (web), AIGenerationTaskIpcAdapter (desktop)
 */

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
 * AI Generation Task API Client Interface
 */
export interface IAIGenerationTaskApiClient {
  // ===== Generation Task CRUD =====

  /** 创建生成任务 */
  createGenerationTask(request: CreateGenerationTaskRequest): Promise<AIGenerationTaskClientDTO>;

  /** 获取生成任务列表 */
  getGenerationTasks(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    status?: string;
  }): Promise<GenerationTaskListResponse>;

  /** 获取生成任务详情 */
  getGenerationTaskById(uuid: string): Promise<AIGenerationTaskClientDTO>;

  /** 取消生成任务 */
  cancelGenerationTask(uuid: string): Promise<void>;

  /** 重试生成任务 */
  retryGenerationTask(uuid: string): Promise<AIGenerationTaskClientDTO>;

  // ===== Goal Generation =====

  /** 生成目标建议 */
  generateGoal(request: GenerateGoalRequest): Promise<GenerateGoalResponse>;

  /** 生成目标及关键结果 */
  generateGoalWithKeyResults(request: GenerateGoalWithKRsRequest): Promise<GenerateGoalWithKRsResponse>;

  /** 为目标生成关键结果 */
  generateKeyResults(goalUuid: string): Promise<GenerateKeyResultsResponse>;
}
