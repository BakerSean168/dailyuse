/**
 * AI Provider Test Result DTO
 */

export interface TestAIProviderResultDTO {
  success: boolean;
  response?: string;
  error?: string;
  latencyMs: number;
}
