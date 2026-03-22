import type { AIProviderConfigServerDTO } from '../../aggregates';

export interface AIProviderConfigModelsUpdatedEvent {
  identityId: string;
  providerConfig: AIProviderConfigServerDTO;
  modelCount: number;
}
