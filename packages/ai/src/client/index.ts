/**
 * AI client seam.
 *
 * Public AI contracts stay centralized in `@memoflow/contracts/ai`.
 * Callers depend on this seam instead of the old application-client /
 * infrastructure-client layered exports.
 */

import type { IResultHttpClient } from '@memoflow/http-client';
import {
  AIClientService,
  createAIClientService,
  type AIClientPort,
  type AssistantDispatchPolicy,
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

export type {
  AssistantDispatchObservedState,
  AssistantDispatchPolicy,
  CreateAIClientServiceOptions,
  AIServiceFromHttpClientOptions,
} from '../application-client';

export {
  AssistantRuntimeHttpClient,
  AssistantRuntimeIpcClient,
  createAssistantRuntimeHttpClient,
  createAssistantRuntimeIpcClient,
  type AssistantRuntimeClient,
  type AssistantRuntimeHandlers,
  type AssistantRuntimeMessageCommand,
} from './runtime-assistant';
export {
  WorkflowRuntimeHttpClient,
  WorkflowRuntimeIpcClient,
  createWorkflowRuntimeHttpClient,
  createWorkflowRuntimeIpcClient,
  type WorkflowRuntimeClient,
} from './runtime-workflow';

/**
 * Host-provided AI client options (plan §4.5). `dispatchPolicy` defaults to
 * `prefer_dispatch` when omitted; hosts pass it explicitly per §3.2.
 *
 * Host 提供的 AI 客户端选项（计划 §4.5）。省略时 `dispatchPolicy` 缺省为
 * `prefer_dispatch`；host 按 §3.2 显式传入。
 */
export interface AIClientFactoryOptions {
  dispatchPolicy?: AssistantDispatchPolicy;
}

export function createAIHttpClient(
  httpClient: IResultHttpClient,
  options?: AIClientFactoryOptions,
): AIClientPort {
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
    options,
  );
}

export function createAIIpcClient(
  ipcClient: IResultIpcClient,
  options?: AIClientFactoryOptions,
): AIClientPort {
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
    options,
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
