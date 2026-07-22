/**
 * AI IPC Adapters - Registration
 */

import type { IResultIpcClient } from '../types';
import { AICapabilitiesIpcAdapter } from './ai-capabilities-ipc.adapter';
import { AIAgentRuntimeIpcAdapter } from './ai-agent-runtime-ipc.adapter';
import { AIAnalyticsQueryIpcAdapter } from './ai-analytics-query-ipc.adapter';
import { AIConversationIpcAdapter } from './ai-conversation-ipc.adapter';
import { AIEvaluationReportIpcAdapter } from './ai-evaluation-report-ipc.adapter';
import { AIMessageIpcAdapter } from './ai-message-ipc.adapter';
import { AIProviderConfigIpcAdapter } from './ai-provider-config-ipc.adapter';
import { AIGoalIpcAdapter } from './ai-goal-ipc.adapter';
import { AIKnowledgeQueryIpcAdapter } from './ai-knowledge-query-ipc.adapter';
import { AIKnowledgeNoteIpcAdapter } from './ai-knowledge-note-ipc.adapter';
import { AIAssistantIpcAdapter } from './ai-assistant-ipc.adapter';

export { AICapabilitiesIpcAdapter } from './ai-capabilities-ipc.adapter';
export { AIAgentRuntimeIpcAdapter } from './ai-agent-runtime-ipc.adapter';
export { AIAnalyticsQueryIpcAdapter } from './ai-analytics-query-ipc.adapter';
export { AIConversationIpcAdapter } from './ai-conversation-ipc.adapter';
export { AIEvaluationReportIpcAdapter } from './ai-evaluation-report-ipc.adapter';
export { AIMessageIpcAdapter } from './ai-message-ipc.adapter';
export { AIProviderConfigIpcAdapter } from './ai-provider-config-ipc.adapter';
export { AIGoalIpcAdapter } from './ai-goal-ipc.adapter';
export { AIKnowledgeQueryIpcAdapter } from './ai-knowledge-query-ipc.adapter';
export { AIKnowledgeNoteIpcAdapter } from './ai-knowledge-note-ipc.adapter';
export { AIAssistantIpcAdapter } from './ai-assistant-ipc.adapter';

export interface AIIpcAdapters {
  capabilities: AICapabilitiesIpcAdapter;
  agentRuntime: AIAgentRuntimeIpcAdapter;
  analytics: AIAnalyticsQueryIpcAdapter;
  conversation: AIConversationIpcAdapter;
  evaluationReport: AIEvaluationReportIpcAdapter;
  message: AIMessageIpcAdapter;
  providerConfig: AIProviderConfigIpcAdapter;
  goal: AIGoalIpcAdapter;
  knowledge: AIKnowledgeQueryIpcAdapter;
  knowledgeNote: AIKnowledgeNoteIpcAdapter;
  assistant: AIAssistantIpcAdapter;
}

export function createAIIpcAdapters(ipcClient: IResultIpcClient): AIIpcAdapters {
  return {
    capabilities: new AICapabilitiesIpcAdapter(ipcClient),
    agentRuntime: new AIAgentRuntimeIpcAdapter(ipcClient),
    analytics: new AIAnalyticsQueryIpcAdapter(ipcClient),
    conversation: new AIConversationIpcAdapter(ipcClient),
    evaluationReport: new AIEvaluationReportIpcAdapter(ipcClient),
    message: new AIMessageIpcAdapter(ipcClient),
    providerConfig: new AIProviderConfigIpcAdapter(ipcClient),
    goal: new AIGoalIpcAdapter(ipcClient),
    knowledge: new AIKnowledgeQueryIpcAdapter(ipcClient),
    knowledgeNote: new AIKnowledgeNoteIpcAdapter(ipcClient),
    assistant: new AIAssistantIpcAdapter(ipcClient),
  };
}
