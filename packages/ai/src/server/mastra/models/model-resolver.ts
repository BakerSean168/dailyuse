import type { OpenAICompatibleConfig } from '@mastra/core/llm';
import type { IAIProviderConfigRepository } from '../../domain/repositories/i-ai-provider-config-repository';
import { resolveActiveProviderConfig } from '../../application/use-cases/commands/ai-provider-resolution';

export interface ResolvedAIModel {
  readonly providerId: string;
  readonly providerName: string;
  readonly modelId: string;
  readonly model: OpenAICompatibleConfig;
}

/**
 * Request-scoped BYOK model resolution for the Mastra runtime.
 * Credentials stay server-side and are never placed in RequestContext, memory,
 * workflow input, snapshots, or client events.
 */
export class MastraModelResolver {
  constructor(private readonly providers: IAIProviderConfigRepository) {}

  async resolve(input: {
    identityId: string;
    providerId?: string | null;
    modelId?: string | null;
  }): Promise<ResolvedAIModel> {
    const provider = await resolveActiveProviderConfig(
      this.providers,
      input.identityId,
      input.providerId ?? undefined,
    );
    const modelId = input.modelId?.trim() || provider.defaultModel?.trim();
    if (!modelId) {
      throw new Error(`AI provider ${provider.id} has no selected model`);
    }

    return {
      providerId: provider.id,
      providerName: provider.name,
      modelId,
      model: {
        // Use a fixed runtime provider id so arbitrary user/provider ids never
        // become framework registration keys. The real product provider id is
        // retained only in MemoFlow metadata above.
        providerId: 'memoflow-byok',
        modelId,
        url: provider.baseUrl,
        apiKey: provider.apiKey,
      },
    };
  }
}
