/**
 * Chat execution port.
 *
 * The application layer should describe "what it needs" from an AI execution
 * engine without depending on whether that engine is:
 * - a direct provider SDK/gateway, or
 * - an internal Python service.
 */

export interface ChatExecutionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatExecutionProviderConfig {
  provider: string;
  model: string;
  embeddingModel?: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatExecutionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatExecutionStreamChunk {
  content: string;
  finishReason?: string;
}

export interface ChatExecutionCompleteInput {
  messages: ChatExecutionMessage[];
  providerConfig: ChatExecutionProviderConfig;
  identityId: string;
  requestId?: string;
}

export interface ChatExecutionCompleteResult {
  content: string;
  finishReason: string;
  usage: ChatExecutionUsage;
}

export interface IAIChatExecutionPort {
  complete(input: ChatExecutionCompleteInput): Promise<ChatExecutionCompleteResult>;
  stream(input: ChatExecutionCompleteInput): AsyncGenerator<ChatExecutionStreamChunk, void, void>;
}
