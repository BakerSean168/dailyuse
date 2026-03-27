import type { ChatExecutionUsage } from './chat-execution.port';

export interface AICostEstimate {
  promptCostUsd: number;
  completionCostUsd: number;
  totalCostUsd: number;
  pricingVersion: string;
  pricingModel: string;
}

export interface AIExecutionLogInput {
  identityId: string;
  taskType: string;
  status: 'COMPLETED' | 'FAILED';
  requestId?: string;
  providerId?: string;
  providerName?: string;
  model?: string;
  errorCategory?: string;
  input: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  tokenUsage?: ChatExecutionUsage;
  costEstimate?: AICostEstimate;
  processingMs?: number;
}

export interface IAIExecutionLogPort {
  record(input: AIExecutionLogInput): Promise<void>;
}
