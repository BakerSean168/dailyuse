/**
 * TokenUsage Value Object
 * Token使用量值对象
 */

export interface TokenUsageDTO {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
