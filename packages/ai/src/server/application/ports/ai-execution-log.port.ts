import type { AIRuntimeUsage } from '@memoflow/contracts/ai';
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
  /** Product-owned thread identifier used for durable usage lookup. */
  conversationId?: string;
  /** Runtime-owned run identifier used for durable workflow/turn lookup. */
  runId?: string;
  requestId?: string;
  traceId?: string;
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

export interface AIUsageQuery {
  identityId: string;
  conversationId?: string;
  runId?: string;
}

export interface AIUsageSummary extends AIRuntimeUsage {
  executionCount: number;
}

/** Read-only usage projection. Identity is always part of the query boundary. */
export interface IAIUsageReadPort {
  summarizeUsage(input: AIUsageQuery): Promise<AIUsageSummary>;
}
