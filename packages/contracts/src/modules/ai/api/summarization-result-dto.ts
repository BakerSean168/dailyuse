/**
 * Summarization Result DTO
 */
export interface SummarizationResultDTO {
  summary: {
    core: string;
    keyPoints: string[];
    actionItems?: string[];
  };
  metadata: {
    tokensUsed: number;
    generatedAt: number;
    inputLength: number;
    compressionRatio: number;
  };
}
