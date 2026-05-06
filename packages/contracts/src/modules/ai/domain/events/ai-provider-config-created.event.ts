import type { IdentityId } from '../../../../primitives';
import type { AIProviderConfigServerDTO } from '../../aggregates/ai-provider-config-server';

export interface AIProviderConfigCreatedEvent {
  identityId: IdentityId;
  providerConfig: AIProviderConfigServerDTO;
}
