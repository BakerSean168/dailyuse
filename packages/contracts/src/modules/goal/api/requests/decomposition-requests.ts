/**
 * Decomposition Requests
 */

/**
 * 分解请求参数
 */
export interface DecompositionRequest {
  goalId: string;
  goalTitle: string;
  goalDescription: string;
  goalDeadline?: Date;
  existingTasks?: Array<{ title: string; id: string }>;
  userContext?: {
    workHoursPerDay?: number;
    skillLevel?: string;
    previousSimilarGoals?: number;
  };
}

/**
 * 分解选项
 */
export interface DecompositionOptions {
  provider?: 'openai' | 'anthropic' | 'local';
  useCache?: boolean;
  maxRetries?: number;
  timeout?: number;
}
