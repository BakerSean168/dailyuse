export interface OpenAICompatibleMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAICompatibleCompletionRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: OpenAICompatibleMessage[];
  temperature?: number;
  responseFormat?: 'text' | 'json';
}

export interface OpenAICompatibleCompletionResult {
  content: string;
  model?: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OpenAICompatibleCompletionResponse {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}
