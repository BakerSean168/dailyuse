/**
 * TokenUsage Value Object
 * Token使用量值对象
 */

// ============ Client DTO ============

export interface TokenUsageClientDTO {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ============ Server DTO ============

export interface TokenUsageServerDTO {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TokenUsagePersistenceDTO {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
