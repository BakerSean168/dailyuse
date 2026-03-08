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
import { AISecretCipher } from '../../../infrastructure-server/security/ai-secret-cipher';
import { OpenAICompatibleGateway } from '../../../infrastructure-server/gateways/openai-compatible.gateway';

const logger = createLogger('AIProviderConfigService');

export class AIProviderConfigService {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly secretCipher = new AISecretCipher(),
    private readonly gateway = new OpenAICompatibleGateway(),
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
      apiKey: this.secretCipher.encrypt(request.apiKey),
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
      apiKey: request.apiKey ? this.secretCipher.encrypt(request.apiKey) : current.apiKey,
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

  async testConnection(request: TestAIProviderReq): Promise<TestAIProviderRes> {
    const provider = request.providerId
      ? await this.providerConfigRepository.findById(request.providerId)
      : null;

    const startedAt = Date.now();
    const baseUrl = provider?.baseUrl ?? request.baseUrl;
    const apiKey = provider ? this.secretCipher.decrypt(provider.apiKey) : request.apiKey;
    const model = provider?.defaultModel ?? request.model;

    if (!baseUrl || !apiKey || !model) {
      throw new Error('Provider config is incomplete');
    }

    try {
      const result = await this.gateway.complete({
        baseUrl,
        apiKey,
        model,
        messages: [{ role: 'user', content: request.testPrompt ?? 'Hello, this is a test.' }],
      });

      return {
        ok: true,
        response: result.content,
        model: result.model ?? model,
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

  private toClientDTO(provider: AIProviderConfigServerDTO): AIProviderConfigClientDTO {
    const plainApiKey = this.secretCipher.decrypt(provider.apiKey);

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
