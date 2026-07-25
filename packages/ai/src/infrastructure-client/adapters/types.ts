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
  IAIAssistantApiClient,
} from '../../application-client/ports/ai-api-client.port';

// ============ Transport Client Interfaces ============

/**
 * IPC Client interface (Result-returning).
 * Canonical definition in @dailyuse/ipc-client (ResultIpcClient), including optional getBridge.
 */
export type { IResultIpcClient } from '@dailyuse/ipc-client';
