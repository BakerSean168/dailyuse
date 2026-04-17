import type { AIProviderConfigServerDTO } from '../../aggregates/ai-provider-config-server';

export interface AIProviderConfigModelsUpdatedEvent {
  identityId: string;
  providerConfig: AIProviderConfigServerDTO;
  modelCount: number;
}
