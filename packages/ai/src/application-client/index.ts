// ===== Port Interfaces =====
export type {
  IAICapabilitiesApiClient,
  AIAnalyticsQueryApiClient,
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIGoalApiClient,
  AIKnowledgeQueryApiClient,
  AIKnowledgeNoteApiClient,
  IAIProviderConfigApiClient,
  AIEvaluationReportApiClient,
  AIAgentRuntimeApiClient,
} from './ports/ai-api-client.port';
export type { AIClientPort } from './ai-client.port';

// ===== Client Service =====
export { AIClientService, createAIClientService } from './ai-client-service';
export { createAIServiceFromHttpClient } from './ai-http-service-factory';
