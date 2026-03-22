import type { AIProviderConfigServerDTO } from '../../aggregates';

export interface AIProviderConfigCreatedEvent {
  identityId: string;
  providerConfig: AIProviderConfigServerDTO;
}
