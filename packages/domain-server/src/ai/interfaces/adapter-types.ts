import { GenerationTaskType, AIProvider, AIModel, TokenUsageServerDTO } from '@dailyuse/contracts/ai';

export interface AIGenerationRequest {
  taskType: GenerationTaskType;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  contextData?: Record<string, unknown>;
}

export interface AIGenerationResponse<T = unknown> {
  content: string;
  parsedContent?: T | null;
  tokenUsage: TokenUsageServerDTO;
  generatedAt: Date;
  model: string;
}

export interface AIStreamChunk {
  delta: string; 
  fullText: string; 
  isDone: boolean; 
  tokenUsage?: TokenUsageServerDTO; 
}

export interface IAIAdapter {
  generateText<T = unknown>(request: AIGenerationRequest): Promise<AIGenerationResponse<T>>;
  streamText(request: AIGenerationRequest): AsyncGenerator<AIStreamChunk, void, unknown>;
  healthCheck(): Promise<boolean>;
  getProvider(): AIProvider;
  getDefaultModel(): AIModel;
}
