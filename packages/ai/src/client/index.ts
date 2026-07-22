/**
 * AI client seam.
 *
 * Public AI contracts stay centralized in `@dailyuse/contracts/ai`.
 * Callers depend on this seam instead of the old application-client /
 * infrastructure-client layered exports.
 */

import type { IResultHttpClient } from '@dailyuse/http-client';
import {
  AIClientService,
  createAIClientService,
  type AIClientPort,
} from '../application-client';
import {
  AICapabilitiesHttpAdapter,
  AIAgentRuntimeHttpAdapter,
  AIAnalyticsQueryHttpAdapter,
  AIConversationHttpAdapter,
  AIEvaluationReportHttpAdapter,
  AIGoalHttpAdapter,
  AIKnowledgeNoteHttpAdapter,
  AIKnowledgeQueryHttpAdapter,
  AIMessageHttpAdapter,
  AIProviderConfigHttpAdapter,
  AIAssistantHttpAdapter,
  createAIHttpAdapters,
  type AIHttpAdapters,
} from '../infrastructure-client/adapters/http';
import {
  AICapabilitiesIpcAdapter,
  AIAgentRuntimeIpcAdapter,
  AIAnalyticsQueryIpcAdapter,
  AIConversationIpcAdapter,
  AIEvaluationReportIpcAdapter,
  AIGoalIpcAdapter,
  AIKnowledgeNoteIpcAdapter,
  AIKnowledgeQueryIpcAdapter,
  AIMessageIpcAdapter,
  AIProviderConfigIpcAdapter,
  AIAssistantIpcAdapter,
  createAIIpcAdapters,
  type AIIpcAdapters,
} from '../infrastructure-client/adapters/ipc';
import type {
  AIAnalyticsQueryApiClient,
  AIAgentRuntimeApiClient,
  AIEvaluationReportApiClient,
  AIKnowledgeNoteApiClient,
  AIKnowledgeQueryApiClient,
  IAICapabilitiesApiClient,
  IAIConversationApiClient,
  IAIGoalApiClient,
  IAIMessageApiClient,
  IAIProviderConfigApiClient,
  IAIAssistantApiClient,
  IResultIpcClient,
} from '../infrastructure-client/adapters/types';

export type {
  AIAnalyticsQueryApiClient,
  AIAgentRuntimeApiClient,
  AIEvaluationReportApiClient,
  AIClientPort,
  AIHttpAdapters,
  AIIpcAdapters,
  AIKnowledgeNoteApiClient,
  AIKnowledgeQueryApiClient,
  IAICapabilitiesApiClient,
  IAIConversationApiClient,
  IAIGoalApiClient,
  IAIMessageApiClient,
  IAIProviderConfigApiClient,
  IAIAssistantApiClient,
  IResultHttpClient,
  IResultIpcClient,
};

export function createAIHttpClient(httpClient: IResultHttpClient): AIClientPort {
  const adapters = createAIHttpAdapters(httpClient);
  return createAIClientService(
    adapters.capabilities,
    adapters.evaluationReport,
    adapters.providerConfig,
    adapters.conversation,
    adapters.message,
    adapters.goal,
    adapters.knowledge,
    adapters.knowledgeNote,
    adapters.analytics,
    adapters.agentRuntime,
    adapters.assistant,
  );
}

export function createAIIpcClient(ipcClient: IResultIpcClient): AIClientPort {
  const adapters = createAIIpcAdapters(ipcClient);
  return createAIClientService(
    adapters.capabilities,
    adapters.evaluationReport,
    adapters.providerConfig,
    adapters.conversation,
    adapters.message,
    adapters.goal,
    adapters.knowledge,
    adapters.knowledgeNote,
    adapters.analytics,
    adapters.agentRuntime,
    adapters.assistant,
  );
}

export {
  AIClientService,
  AICapabilitiesHttpAdapter,
  AICapabilitiesIpcAdapter,
  AIAgentRuntimeHttpAdapter,
  AIAgentRuntimeIpcAdapter,
  AIAnalyticsQueryHttpAdapter,
  AIAnalyticsQueryIpcAdapter,
  AIConversationHttpAdapter,
  AIConversationIpcAdapter,
  AIEvaluationReportHttpAdapter,
  AIEvaluationReportIpcAdapter,
  AIGoalHttpAdapter,
  AIGoalIpcAdapter,
  AIKnowledgeNoteHttpAdapter,
  AIKnowledgeNoteIpcAdapter,
  AIKnowledgeQueryHttpAdapter,
  AIKnowledgeQueryIpcAdapter,
  AIMessageHttpAdapter,
  AIMessageIpcAdapter,
  AIProviderConfigHttpAdapter,
  AIProviderConfigIpcAdapter,
  AIAssistantHttpAdapter,
  AIAssistantIpcAdapter,
  createAIClientService,
  createAIHttpAdapters,
  createAIIpcAdapters,
};
