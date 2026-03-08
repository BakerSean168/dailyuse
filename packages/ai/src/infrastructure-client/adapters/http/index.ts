/**
 * AI HTTP Adapters - Registration
 */

import type { IResultHttpClient } from '../types';
import { AIConversationHttpAdapter } from './ai-conversation-http.adapter';
import { AIMessageHttpAdapter } from './ai-message-http.adapter';
import { AIProviderConfigHttpAdapter } from './ai-provider-config-http.adapter';
import { AIGoalHttpAdapter } from './ai-goal-http.adapter';
import { AIKnowledgeNoteHttpAdapter } from './ai-knowledge-note-http.adapter';

export { AIConversationHttpAdapter } from './ai-conversation-http.adapter';
export { AIMessageHttpAdapter } from './ai-message-http.adapter';
export { AIProviderConfigHttpAdapter } from './ai-provider-config-http.adapter';
export { AIGoalHttpAdapter } from './ai-goal-http.adapter';
export { AIKnowledgeNoteHttpAdapter } from './ai-knowledge-note-http.adapter';

export interface AIHttpAdapters {
  conversation: AIConversationHttpAdapter;
  message: AIMessageHttpAdapter;
  providerConfig: AIProviderConfigHttpAdapter;
  goal: AIGoalHttpAdapter;
  knowledgeNote: AIKnowledgeNoteHttpAdapter;
}

export function createAIHttpAdapters(httpClient: IResultHttpClient): AIHttpAdapters {
  return {
    conversation: new AIConversationHttpAdapter(httpClient),
    message: new AIMessageHttpAdapter(httpClient),
    providerConfig: new AIProviderConfigHttpAdapter(httpClient),
    goal: new AIGoalHttpAdapter(httpClient),
    knowledgeNote: new AIKnowledgeNoteHttpAdapter(httpClient),
  };
}
