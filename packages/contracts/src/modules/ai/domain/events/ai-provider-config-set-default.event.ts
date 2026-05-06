import type { IdentityId } from '../../../../primitives';
import type { AIProviderConfigServerDTO } from '../../aggregates/ai-provider-config-server';

export interface AIProviderConfigSetDefaultEvent {
  identityId: IdentityId;
  providerConfig: AIProviderConfigServerDTO;
}
