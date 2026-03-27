import {
  AIProviderType,
  type AIProviderConfigClientDTO,
  type AIProviderConfigServerDTO,
  type CreateAIProviderConfigReq,
  type TestAIProviderReq,
  type TestAIProviderRes,
  type UpdateAIProviderConfigReq,
} from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';
import { AiProviderConfigId } from '../../../domain-shared/value-objects/ai-provider-config-id';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import type { IAIChatExecutionPort } from '../../ports';
import { toChatExecutionProviderConfig } from './ai-provider-resolution';

const logger = createLogger('AIProviderConfigService');

export class AIProviderConfigService {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly chatExecutionPort: IAIChatExecutionPort,
  ) {}

  async createProvider(
    identityId: string,
    request: CreateAIProviderConfigReq,
  ): Promise<AIProviderConfigClientDTO> {
    if (request.isDefault) {
      await this.providerConfigRepository.clearDefaultForIdentity(identityId);
    }

    const now = Date.now();
    const provider: AIProviderConfigServerDTO = {
      id: AiProviderConfigId.generate(),
      identityId: identityId as AIProviderConfigServerDTO['identityId'],
      name: request.name.trim(),
      providerType: AIProviderType.OpenAICompatible,
      baseUrl: request.baseUrl.replace(/\/+$/, ''),
      apiKey: request.apiKey,
      defaultModel: request.model,
      availableModels: [],
      isActive: true,
      isDefault: request.isDefault ?? false,
      priority: 100,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    await this.providerConfigRepository.save(provider);
    logger.info('AI provider created', { identityId, providerId: provider.id });
    return this.toClientDTO(provider);
  }

  async updateProvider(
    id: string,
    request: UpdateAIProviderConfigReq,
  ): Promise<AIProviderConfigClientDTO> {
    const current = await this.providerConfigRepository.findById(id);
    if (!current) {
      throw new Error('Provider not found');
    }

    if (request.isDefault) {
      await this.providerConfigRepository.clearDefaultForIdentity(String(current.identityId));
    }

    const updated: AIProviderConfigServerDTO = {
      ...current,
      name: request.name?.trim() ?? current.name,
      baseUrl: request.baseUrl?.replace(/\/+$/, '') ?? current.baseUrl,
      apiKey: request.apiKey ?? current.apiKey,
      defaultModel: request.model ?? current.defaultModel,
      isDefault: request.isDefault ?? current.isDefault,
      isActive: request.isActive ?? current.isActive,
      updatedAt: Date.now(),
      version: current.version + 1,
    };

    await this.providerConfigRepository.save(updated);
    return this.toClientDTO(updated);
  }

  async deleteProvider(id: string): Promise<void> {
    await this.providerConfigRepository.delete(id);
  }

  async getProvider(id: string): Promise<AIProviderConfigClientDTO> {
    const provider = await this.providerConfigRepository.findById(id);
    if (!provider) {
      throw new Error('Provider not found');
    }
    return this.toClientDTO(provider);
  }

  async listProviders(identityId: string): Promise<AIProviderConfigClientDTO[]> {
    const providers = await this.providerConfigRepository.findByIdentityId(identityId);
    return providers.map((provider) => this.toClientDTO(provider));
  }

  async testConnection(identityId: string, request: TestAIProviderReq): Promise<TestAIProviderRes> {
    const startedAt = Date.now();
    const providerConfig = await this.resolveProviderConfigForConnectionTest(identityId, request);

    try {
      const result = await this.chatExecutionPort.complete({
        identityId,
        providerConfig,
        messages: [{ role: 'user', content: request.testPrompt ?? 'Hello, this is a test.' }],
      });

      return {
        ok: true,
        response: result.content,
        model: providerConfig.model,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown provider error',
        latencyMs: Date.now() - startedAt,
      };
    }
  }

  async setDefaultProvider(id: string, identityId: string): Promise<void> {
    const provider = await this.providerConfigRepository.findById(id);
    if (!provider || String(provider.identityId) !== identityId) {
      throw new Error('Provider not found');
    }

    await this.providerConfigRepository.clearDefaultForIdentity(identityId);
    await this.providerConfigRepository.save({
      ...provider,
      isDefault: true,
      updatedAt: Date.now(),
      version: provider.version + 1,
    });
  }

  async getDefaultProvider(identityId: string): Promise<AIProviderConfigClientDTO | null> {
    const provider = await this.providerConfigRepository.findDefaultByIdentityId(identityId);
    return provider ? this.toClientDTO(provider) : null;
  }

  private async resolveProviderConfigForConnectionTest(
    identityId: string,
    request: TestAIProviderReq,
  ) {
    if (request.providerId) {
      const provider = await this.providerConfigRepository.findById(request.providerId);
      if (!provider || String(provider.identityId) !== identityId) {
        throw new Error('Provider not found');
      }

      return toChatExecutionProviderConfig(provider, {
        temperature: 0.2,
      });
    }

    if (!request.baseUrl || !request.apiKey || !request.model) {
      throw new Error('Provider config is incomplete');
    }

    return toChatExecutionProviderConfig(
      {
        providerType: AIProviderType.OpenAICompatible,
        baseUrl: request.baseUrl,
        apiKey: request.apiKey,
        defaultModel: request.model,
      },
      {
        temperature: 0.2,
      },
    );
  }

  private toClientDTO(provider: AIProviderConfigServerDTO): AIProviderConfigClientDTO {
    const plainApiKey = provider.apiKey;

    return {
      id: provider.id,
      identityId: provider.identityId,
      name: provider.name,
      providerType: provider.providerType,
      baseUrl: provider.baseUrl,
      apiKeyMasked:
        plainApiKey.length > 8 ? `${plainApiKey.slice(0, 3)}****${plainApiKey.slice(-4)}` : '****',
      defaultModel: provider.defaultModel,
      availableModels: provider.availableModels,
      isActive: provider.isActive,
      isDefault: provider.isDefault,
      priority: provider.priority,
      version: provider.version,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
      deletedAt: provider.deletedAt,
    };
  }
}
