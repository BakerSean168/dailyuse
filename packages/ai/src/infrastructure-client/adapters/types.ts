/**
 * AI Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for AI API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/ai.
 */

export type { IHttpClient } from '@dailyuse/http-client';
export type { IResultHttpClient } from '@dailyuse/http-client';

// Re-export port interfaces from application-client ports
export type {
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIStreamMessageApiClient,
  IAIGoalApiClient,
  IAICapabilitiesApiClient,
  AIEvaluationReportApiClient,
  AIKnowledgeNoteApiClient,
  AIKnowledgeQueryApiClient,
  AIAnalyticsQueryApiClient,
  IAIProviderConfigApiClient,
} from '../../application-client/ports/ai-api-client.port';

// ============ Transport Client Interfaces ============

// IHttpClient imported from @dailyuse/http-client

export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

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
