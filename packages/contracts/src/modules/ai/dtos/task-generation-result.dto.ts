/**
 * Generated Task Preview DTO
 */

export interface GeneratedTaskPreview {
  title: string;
  description?: string;
  estimatedDuration?: number;
  priority?: number;
  dependencies?: string[];
}

export interface GenerateTasksResultDTO {
  tasks: GeneratedTaskPreview[];
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: string;
  processingTimeMs: number;
}
