/**
 * AI Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for AI API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @memoflow/contracts/ai.
 */

export type { IResultHttpClient } from '@memoflow/http-client';

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
 * Canonical definition in @memoflow/ipc-client (ResultIpcClient), including optional getBridge.
 */
export type { IResultIpcClient } from '@memoflow/ipc-client';
