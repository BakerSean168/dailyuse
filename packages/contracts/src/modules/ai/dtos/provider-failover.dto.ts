/**
 * AI Provider Failover DTOs
 */

export interface FailoverResultDTO<T> {
  success: boolean;
  data?: T;
  error?: string;
  attemptedProviders: string[];
}
