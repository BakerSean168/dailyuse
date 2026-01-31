/**
 * AI Module API Requests & Responses
 * AI模块 API 请求和响应类型定义
 */

import type {
  AIConversationClientDTO,
  AIGenerationTaskClientDTO,
  AIUsageQuotaClientDTO,
  MessageClientDTO,
} from './index';
import type { ConversationStatus, GenerationTaskType, AIProvider, AIModel } from './enums';

// ============ Conversation Requests ============

export interface CreateConversationRequest {
  title: string;
}

export interface UpdateConversationRequest {
  title?: string;
  status?: ConversationStatus;
}

export interface ConversationResponse {
  conversation: AIConversationClientDTO;
}

export interface ConversationListResponse {
  conversations: AIConversationClientDTO[];
  total: number;
}

// ============ Message Requests ============

export interface SendMessageRequest {
  conversationUuid: string;
  content: string;
}

export interface MessageResponse {
  message: MessageClientDTO;
}

export interface MessageListResponse {
  messages: MessageClientDTO[];
  total: number;
}

// ============ Generation Task Requests ============

export interface CreateGenerationTaskRequest {
  conversationUuid?: string;
  type: GenerationTaskType;
  provider: AIProvider;
  model: AIModel;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  contextData?: Record<string, unknown>;
}

export interface GenerationTaskResponse {
  task: AIGenerationTaskClientDTO;
}

export interface GenerationTaskListResponse {
  tasks: AIGenerationTaskClientDTO[];
  total: number;
}

// ============ AI Chat Streaming Requests ============

export interface ChatStreamRequest {
  conversationUuid: string;
  message: string;
  provider?: AIProvider;
  model?: AIModel;
}

export interface ChatStreamChunk {
  delta: string;
  isDone: boolean;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============ Usage Quota Requests ============

export interface QuotaResponse {
  quota: AIUsageQuotaClientDTO;
}

export interface UpdateQuotaLimitRequest {
  newLimit: number;
}

// ============ AI Generation Requests (Epic 2) ============

export * from './api-requests/generate-key-results-request';
export * from './api-responses/generate-key-results-response';
export * from './api-requests/generate-tasks-request';
export * from './api-responses/generate-tasks-response';
// Summarization (Epic 4 Story 4.1)
export * from './api-requests/summarization-request';
export * from './api-responses/summarization-result-dto';
// Knowledge Generation (Epic 4 Story 4.3)
export * from './api-requests/knowledge-generation-request';
export * from './api-responses/knowledge-generation-task-dto';
// Goal Generation (Story AI-002)
export * from './api-requests/generate-goal-request';
export * from './api-responses/generate-goal-response';
// AI Provider Config (Story AI-002)
export * from './api-requests/ai-provider-config-request';

// ============ Common List Request ============

export interface ListRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
