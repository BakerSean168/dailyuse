import { normalizeOpenAICompatibleModelId } from '../../../shared/openai-compatible-normalize';
import { AIProviderType, type AIProviderConfigServerDTO } from '@dailyuse/contracts/ai';

import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import type { ChatExecutionProviderConfig } from '../../ports';

/**
 * Resolve the provider config that should be used for an AI operation.
 *
 * A few application services need exactly the same policy:
 * 1. respect an explicitly selected provider when it belongs to the caller
 * 2. otherwise use the caller's default provider
 * 3. otherwise fall back to the first active provider
 *
 * Keeping that policy in one place prevents subtle drift between chat,
 * knowledge-note generation, and future AI flows.
 */
export async function resolveActiveProviderConfig(
  providerConfigRepository: IAIProviderConfigRepository,
  identityId: string,
  providerId?: string,
): Promise<AIProviderConfigServerDTO> {
  if (providerId) {
    const selectedProvider = await providerConfigRepository.findById(providerId);
    if (selectedProvider?.isActive && String(selectedProvider.identityId) === identityId) {
      return selectedProvider;
    }
  }

  const defaultProvider = await providerConfigRepository.findDefaultByIdentityId(identityId);
  if (defaultProvider?.isActive) {
    return defaultProvider;
  }

  const providers = await providerConfigRepository.findByIdentityId(identityId);
  const activeProvider = providers.find((provider) => provider.isActive);
  if (!activeProvider) {
    throw new Error('No AI provider configured');
  }

  return activeProvider;
}

/**
 * Translate the stored provider record into the transport-neutral execution
 * config expected by the AI execution port.
 */
export function toChatExecutionProviderConfig(
  providerConfig: {
    providerType?: string;
    defaultModel: string | null;
    apiKey: string;
    baseUrl: string;
  },
  options?: {
    modelOverride?: string;
    temperature?: number;
    maxTokens?: number;
  },
): ChatExecutionProviderConfig {
  return {
    provider: toExecutionProviderName(providerConfig.providerType),
    model: normalizeOpenAICompatibleModelId(options?.modelOverride ?? providerConfig.defaultModel ?? 'gpt-4o-mini'),
    apiKey: providerConfig.apiKey,
    baseUrl: providerConfig.baseUrl,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens,
  };
}

function toExecutionProviderName(providerType?: string): string {
  switch (providerType) {
    case AIProviderType.OpenAICompatible:
    default:
      return 'openai';
  }
}



