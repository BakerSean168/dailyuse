/**
 * AI IPC Adapters - Registration
 */

import type { IResultIpcClient } from '../types';
import { AIConversationIpcAdapter } from './ai-conversation-ipc.adapter';
import { AIMessageIpcAdapter } from './ai-message-ipc.adapter';
import { AIProviderConfigIpcAdapter } from './ai-provider-config-ipc.adapter';
import { AIGoalIpcAdapter } from './ai-goal-ipc.adapter';
import { AIKnowledgeNoteIpcAdapter } from './ai-knowledge-note-ipc.adapter';

export { AIConversationIpcAdapter } from './ai-conversation-ipc.adapter';
export { AIMessageIpcAdapter } from './ai-message-ipc.adapter';
export { AIProviderConfigIpcAdapter } from './ai-provider-config-ipc.adapter';
export { AIGoalIpcAdapter } from './ai-goal-ipc.adapter';
export { AIKnowledgeNoteIpcAdapter } from './ai-knowledge-note-ipc.adapter';

export interface AIIpcAdapters {
  conversation: AIConversationIpcAdapter;
  message: AIMessageIpcAdapter;
  providerConfig: AIProviderConfigIpcAdapter;
  goal: AIGoalIpcAdapter;
  knowledgeNote: AIKnowledgeNoteIpcAdapter;
}

export function createAIIpcAdapters(ipcClient: IResultIpcClient): AIIpcAdapters {
  return {
    conversation: new AIConversationIpcAdapter(ipcClient),
    message: new AIMessageIpcAdapter(ipcClient),
    providerConfig: new AIProviderConfigIpcAdapter(ipcClient),
    goal: new AIGoalIpcAdapter(ipcClient),
    knowledgeNote: new AIKnowledgeNoteIpcAdapter(ipcClient),
  };
}
