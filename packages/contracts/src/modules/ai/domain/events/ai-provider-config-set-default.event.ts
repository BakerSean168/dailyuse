import type { AIProviderConfigServerDTO } from '../../aggregates';

export interface AIProviderConfigSetDefaultEvent {
  identityId: string;
  providerConfig: AIProviderConfigServerDTO;
}
