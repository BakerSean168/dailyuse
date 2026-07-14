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
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface OpenAICompatibleCompletionResult {
  content: string;
  model?: string;
  finishReason?: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OpenAICompatibleCompletionResponse {
  model?: string;
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      /** OpenAI returns string; some Gemini-compatible proxies return part arrays. */
      content?: string | Array<string | { text?: string }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}
