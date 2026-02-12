/**
 * AI HTTP Adapters - Registration
 */

import type { IHttpClient } from '../types';
import { AIConversationHttpAdapter } from './ai-conversation-http.adapter';
import { AIMessageHttpAdapter } from './ai-message-http.adapter';
import { AIGenerationTaskHttpAdapter } from './ai-generation-task-http.adapter';
import { AIUsageQuotaHttpAdapter } from './ai-usage-quota-http.adapter';
import { AIProviderConfigHttpAdapter } from './ai-provider-config-http.adapter';

export { AIConversationHttpAdapter } from './ai-conversation-http.adapter';
export { AIMessageHttpAdapter } from './ai-message-http.adapter';
export { AIGenerationTaskHttpAdapter } from './ai-generation-task-http.adapter';
export { AIUsageQuotaHttpAdapter } from './ai-usage-quota-http.adapter';
export { AIProviderConfigHttpAdapter } from './ai-provider-config-http.adapter';

export interface AIHttpAdapters {
  conversation: AIConversationHttpAdapter;
  message: AIMessageHttpAdapter;
  generationTask: AIGenerationTaskHttpAdapter;
  usageQuota: AIUsageQuotaHttpAdapter;
  providerConfig: AIProviderConfigHttpAdapter;
}

export function createAIHttpAdapters(httpClient: IHttpClient): AIHttpAdapters {
  return {
    conversation: new AIConversationHttpAdapter(httpClient),
    message: new AIMessageHttpAdapter(httpClient),
    generationTask: new AIGenerationTaskHttpAdapter(httpClient),
    usageQuota: new AIUsageQuotaHttpAdapter(httpClient),
    providerConfig: new AIProviderConfigHttpAdapter(httpClient),
  };
}
