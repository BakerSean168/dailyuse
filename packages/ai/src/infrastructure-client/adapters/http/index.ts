/**
 * AI HTTP Adapters - Registration
 */

import type { IResultHttpClient } from '../types';
import { AICapabilitiesHttpAdapter } from './ai-capabilities-http.adapter';
import { AIAgentRuntimeHttpAdapter } from './ai-agent-runtime-http.adapter';
import { AIAnalyticsQueryHttpAdapter } from './ai-analytics-query-http.adapter';
import { AIConversationHttpAdapter } from './ai-conversation-http.adapter';
import { AIEvaluationReportHttpAdapter } from './ai-evaluation-report-http.adapter';
import { AIMessageHttpAdapter } from './ai-message-http.adapter';
import { AIProviderConfigHttpAdapter } from './ai-provider-config-http.adapter';
import { AIGoalHttpAdapter } from './ai-goal-http.adapter';
import { AIKnowledgeQueryHttpAdapter } from './ai-knowledge-query-http.adapter';
import { AIKnowledgeNoteHttpAdapter } from './ai-knowledge-note-http.adapter';

export { AICapabilitiesHttpAdapter } from './ai-capabilities-http.adapter';
export { AIAgentRuntimeHttpAdapter } from './ai-agent-runtime-http.adapter';
export { AIAnalyticsQueryHttpAdapter } from './ai-analytics-query-http.adapter';
export { AIConversationHttpAdapter } from './ai-conversation-http.adapter';
export { AIEvaluationReportHttpAdapter } from './ai-evaluation-report-http.adapter';
export { AIMessageHttpAdapter } from './ai-message-http.adapter';
export { AIProviderConfigHttpAdapter } from './ai-provider-config-http.adapter';
export { AIGoalHttpAdapter } from './ai-goal-http.adapter';
export { AIKnowledgeQueryHttpAdapter } from './ai-knowledge-query-http.adapter';
export { AIKnowledgeNoteHttpAdapter } from './ai-knowledge-note-http.adapter';

export interface AIHttpAdapters {
  capabilities: AICapabilitiesHttpAdapter;
  agentRuntime: AIAgentRuntimeHttpAdapter;
  analytics: AIAnalyticsQueryHttpAdapter;
  conversation: AIConversationHttpAdapter;
  evaluationReport: AIEvaluationReportHttpAdapter;
  message: AIMessageHttpAdapter;
  providerConfig: AIProviderConfigHttpAdapter;
  goal: AIGoalHttpAdapter;
  knowledge: AIKnowledgeQueryHttpAdapter;
  knowledgeNote: AIKnowledgeNoteHttpAdapter;
}

export function createAIHttpAdapters(httpClient: IResultHttpClient): AIHttpAdapters {
  return {
    capabilities: new AICapabilitiesHttpAdapter(httpClient),
    agentRuntime: new AIAgentRuntimeHttpAdapter(httpClient),
    analytics: new AIAnalyticsQueryHttpAdapter(httpClient),
    conversation: new AIConversationHttpAdapter(httpClient),
    evaluationReport: new AIEvaluationReportHttpAdapter(httpClient),
    message: new AIMessageHttpAdapter(httpClient),
    providerConfig: new AIProviderConfigHttpAdapter(httpClient),
    goal: new AIGoalHttpAdapter(httpClient),
    knowledge: new AIKnowledgeQueryHttpAdapter(httpClient),
    knowledgeNote: new AIKnowledgeNoteHttpAdapter(httpClient),
  };
}
