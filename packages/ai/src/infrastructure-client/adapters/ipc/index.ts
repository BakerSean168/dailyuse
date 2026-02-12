/**
 * AI IPC Adapters - Registration
 */

import type { IIpcClient } from '../types';
import { AIConversationIpcAdapter } from './ai-conversation-ipc.adapter';
import { AIMessageIpcAdapter } from './ai-message-ipc.adapter';
import { AIGenerationTaskIpcAdapter } from './ai-generation-task-ipc.adapter';
import { AIUsageQuotaIpcAdapter } from './ai-usage-quota-ipc.adapter';
import { AIProviderConfigIpcAdapter } from './ai-provider-config-ipc.adapter';

export { AIConversationIpcAdapter } from './ai-conversation-ipc.adapter';
export { AIMessageIpcAdapter } from './ai-message-ipc.adapter';
export { AIGenerationTaskIpcAdapter } from './ai-generation-task-ipc.adapter';
export { AIUsageQuotaIpcAdapter } from './ai-usage-quota-ipc.adapter';
export { AIProviderConfigIpcAdapter } from './ai-provider-config-ipc.adapter';

export interface AIIpcAdapters {
  conversation: AIConversationIpcAdapter;
  message: AIMessageIpcAdapter;
  generationTask: AIGenerationTaskIpcAdapter;
  usageQuota: AIUsageQuotaIpcAdapter;
  providerConfig: AIProviderConfigIpcAdapter;
}

export function createAIIpcAdapters(ipcClient: IIpcClient): AIIpcAdapters {
  return {
    conversation: new AIConversationIpcAdapter(ipcClient),
    message: new AIMessageIpcAdapter(ipcClient),
    generationTask: new AIGenerationTaskIpcAdapter(ipcClient),
    usageQuota: new AIUsageQuotaIpcAdapter(ipcClient),
    providerConfig: new AIProviderConfigIpcAdapter(ipcClient),
  };
}
