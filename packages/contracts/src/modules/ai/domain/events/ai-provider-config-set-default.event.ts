import type { AIProviderConfigServerDTO } from '../../aggregates/ai-provider-config-server';

export interface AIProviderConfigSetDefaultEvent {
  identityId: string;
  providerConfig: AIProviderConfigServerDTO;
}
