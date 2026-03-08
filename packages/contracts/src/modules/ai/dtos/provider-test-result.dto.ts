/**
 * AI Provider Test Result DTO
 */

export interface TestAIProviderResultDTO {
  ok: boolean;
  response?: string;
  model?: string;
  error?: string;
  latencyMs: number;
}
