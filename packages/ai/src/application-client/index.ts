/**
 * AI Module - Application Client
 *
 * Placeholder - AI client services to be implemented with
 * constructor-injected pattern using Result<T>.
 */

// ===== Port Interfaces =====
export type {
  IAIConversationApiClient,
  IAIMessageApiClient,
  IAIGenerationTaskApiClient,
  IAIProviderConfigApiClient,
  IAIUsageQuotaApiClient,
} from '../infrastructure-client/adapters/types';

// Singleton placeholder
let _aiApplicationService: any = null;

export function setAiApplicationService(service: any) {
  _aiApplicationService = service;
}

export const aiApplicationService: any = new Proxy({} as any, {
  get(_target, prop) {
    if (!_aiApplicationService) {
      throw new Error('aiApplicationService not initialized. Call setAiApplicationService first.');
    }
    return (_aiApplicationService as any)[prop];
  },
});
