/**
 * AI Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for AI API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/ai.
 */

export type { IResultHttpClient } from '@dailyuse/http-client';

// Re-export port interfaces from application-client ports
export type {
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIGoalApiClient,
  IAICapabilitiesApiClient,
  AIEvaluationReportApiClient,
  AIKnowledgeNoteApiClient,
  AIKnowledgeQueryApiClient,
  AIAnalyticsQueryApiClient,
  AIAgentRuntimeApiClient,
  IAIProviderConfigApiClient,
} from '../../application-client/ports/ai-api-client.port';

// ============ Transport Client Interfaces ============

export interface IResultIpcClient {
  invoke<T = unknown>(
    channel: string,
    ...args: unknown[]
  ): Promise<import('@dailyuse/contracts/result').Result<T>>;
  getBridge?: () =>
    | {
        on(channel: string, callback: (...args: unknown[]) => void): void;
        off(channel: string, callback: (...args: unknown[]) => void): void;
      }
    | undefined;
}
