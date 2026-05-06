import type { IdentityId } from '../../../../primitives';
import type { AIProviderConfigServerDTO } from '../../aggregates/ai-provider-config-server';

export interface AIProviderConfigModelsUpdatedEvent {
  identityId: IdentityId;
  providerConfig: AIProviderConfigServerDTO;
  modelCount: number;
}
