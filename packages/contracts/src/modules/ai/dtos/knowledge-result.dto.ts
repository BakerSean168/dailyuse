/**
 * AI Knowledge Generation DTO
 */

export interface KnowledgeGenerationResultDTO {
  content: string;
  metadata: Record<string, unknown>;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: string;
  processingTimeMs: number;
}

export interface SummarizationResultDTO {
  summary: string;
  keyPoints?: string[];
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: string;
  processingTimeMs: number;
}
