import type { AIProviderConfigServerDTO } from '../../aggregates/ai-provider-config-server';

export interface AIProviderConfigCreatedEvent {
  identityId: string;
  providerConfig: AIProviderConfigServerDTO;
}
