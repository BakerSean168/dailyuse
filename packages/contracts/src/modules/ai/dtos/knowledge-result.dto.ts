/**
 * AI Knowledge Generation DTO
 */

import type { AiProviderConfigId } from '@/primitives';

export interface KnowledgeGenerationResultDTO {
  content: string;
  metadata: Record<string, unknown>;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: AiProviderConfigId;
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
  providerId: AiProviderConfigId;
  processingTimeMs: number;
}
