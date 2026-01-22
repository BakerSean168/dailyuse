/**
 * AI Provider Config Application Service
 *
 * AI 服务提供商配置应用服务 - 管理 Provider 配置的 CRUD、测试、默认状态管理
 * 依赖注入模式：所有依赖通过构造函数注入，不直接依赖具体实现
 */

import type { IAIProviderConfigRepository, IAIAdapter } from '@dailyuse/domain-server/ai';
import { AIProviderConfigServer } from '@dailyuse/domain-server/ai';
import type {
  AIProviderConfigServerDTO,
  AIProviderConfigClientDTO,
  AIModelInfo,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
  TestAIProviderConnectionRequest,
  TestAIProviderConnectionResponse,
} from '@dailyuse/contracts/ai';
import { AIProviderType } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIProviderConfigService');

/**
 * Adapter Factory Function Type
 */
export type AIAdapterFactoryFn = (provider: AIProviderConfigServerDTO) => Promise<IAIAdapter>;

/**
 * AI Provider Config Application Service
 */
export class AIProviderConfigService {
  constructor(
    private readonly providerRepository: IAIProviderConfigRepository,
    private readonly adapterFactory: AIAdapterFactoryFn,
  ) {}

  /**
   * 创建新的 AI Provider 配置
   */
  async createProvider(
    accountUuid: string,
    request: CreateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    // 1. 检查名称唯一性
    const existing = await this.providerRepository.findByAccountUuidAndName(
      accountUuid,
      request.name,
    );
    if (existing) {
      throw new Error(`Provider with name "${request.name}" already exists`);
    }

    // 2. 如果设置为默认，先清除其他默认
    if (request.setAsDefault) {
      await this.providerRepository.clearDefaultForAccount(accountUuid);
    }

    // 3. 创建聚合根
    const provider = AIProviderConfigServer.create({
      accountUuid,
      name: request.name,
      providerType: request.providerType,
      baseUrl: request.baseUrl,
      apiKey: request.apiKey,
      defaultModel: request.defaultModel,
      isDefault: request.setAsDefault ?? false,
    });

    // 4. 持久化
    await this.providerRepository.save(provider.toServerDTO());

    logger.info('AI Provider created', {
      accountUuid,
      providerName: request.name,
      providerType: request.providerType,
    });

    return provider.toClientDTO();
  }

  /**
   * 获取用户的所有 Provider 配置
   */
  async getProviders(accountUuid: string): Promise<AIProviderConfigClientDTO[]> {
    const providers = await this.providerRepository.findByAccountUuid(accountUuid);
    return providers.map((dto) => AIProviderConfigServer.fromServerDTO(dto).toClientDTO());
  }

  /**
   * 获取单个 Provider 配置
   */
  async getProvider(
    accountUuid: string,
    providerUuid: string,
  ): Promise<AIProviderConfigClientDTO | null> {
    const provider = await this.providerRepository.findByUuid(providerUuid);
    if (!provider || provider.accountUuid !== accountUuid) {
      return null;
    }
    return AIProviderConfigServer.fromServerDTO(provider).toClientDTO();
  }

  /**
   * 获取用户的默认 Provider
   */
  async getDefaultProvider(accountUuid: string): Promise<AIProviderConfigServerDTO | null> {
    return this.providerRepository.findDefaultByAccountUuid(accountUuid);
  }

  /**
   * 更新 Provider 配置
   */
  async updateProvider(
    accountUuid: string,
    providerUuid: string,
    request: UpdateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    // 1. 获取现有配置
    const existingDTO = await this.providerRepository.findByUuid(providerUuid);
    if (!existingDTO || existingDTO.accountUuid !== accountUuid) {
      throw new Error('Provider not found');
    }

    // 2. 重建聚合根
    const provider = AIProviderConfigServer.fromServerDTO(existingDTO);

    // 3. 应用更新
    if (request.name !== undefined) {
      // 检查名称唯一性
      const nameConflict = await this.providerRepository.findByAccountUuidAndName(
        accountUuid,
        request.name,
      );
      if (nameConflict && nameConflict.uuid !== providerUuid) {
        throw new Error(`Provider with name "${request.name}" already exists`);
      }
      provider.updateName(request.name);
    }

    if (request.baseUrl !== undefined) {
      provider.updateBaseUrl(request.baseUrl);
    }

    if (request.apiKey !== undefined) {
      provider.updateApiKey(request.apiKey);
    }

    if (request.defaultModel !== undefined) {
      provider.setDefaultModel(request.defaultModel);
    }

    if (request.isActive !== undefined) {
      if (request.isActive) {
        provider.activate();
      } else {
        provider.deactivate();
      }
    }

    // 4. 持久化
    await this.providerRepository.save(provider.toServerDTO());

    logger.info('AI Provider updated', {
      accountUuid,
      providerUuid,
    });

    return provider.toClientDTO();
  }

  /**
   * 删除 Provider 配置
   */
  async deleteProvider(accountUuid: string, providerUuid: string): Promise<void> {
    // 1. 验证权限
    const provider = await this.providerRepository.findByUuid(providerUuid);
    if (!provider || provider.accountUuid !== accountUuid) {
      throw new Error('Provider not found');
    }

    // 2. 删除
    await this.providerRepository.delete(providerUuid);

    logger.info('AI Provider deleted', {
      accountUuid,
      providerUuid,
    });
  }

  /**
   * 设置默认 Provider
   */
  async setDefaultProvider(accountUuid: string, providerUuid: string): Promise<void> {
    // 1. 获取 Provider
    const providerDTO = await this.providerRepository.findByUuid(providerUuid);
    if (!providerDTO || providerDTO.accountUuid !== accountUuid) {
      throw new Error('Provider not found');
    }

    const provider = AIProviderConfigServer.fromServerDTO(providerDTO);

    // 2. 清除其他默认
    await this.providerRepository.clearDefaultForAccount(accountUuid);

    // 3. 设置新默认
    provider.setAsDefault();
    await this.providerRepository.save(provider.toServerDTO());

    logger.info('Default AI Provider set', {
      accountUuid,
      providerUuid,
    });
  }

  /**
   * 测试 Provider 连接（保存前测试）
   */
  async testConnection(
    request: TestAIProviderConnectionRequest,
  ): Promise<TestAIProviderConnectionResponse> {
    const startTime = Date.now();

    try {
      if (!this.adapterFactory) throw new Error('Adapter Factory not injected');

      const tempConfig = {
        uuid: 'temp',
        accountUuid: 'temp',
        name: 'temp',
        provider: request.providerType,
        apiKey: request.apiKey,
        baseUrl: request.baseUrl,
        isActive: true,
      } as any;

      const adapter = this.adapterFactory(tempConfig);
      const isHealthy = await adapter.healthCheck();

      const result = { ok: isHealthy, error: isHealthy ? undefined : 'Health check failed' };

      // 如果连接成功，尝试获取模型列表
      let models: AIModelInfo[] = [];
      if (result.ok) {
        models = await this.fetchModels(request.providerType, request.baseUrl, request.apiKey);
      }

      return {
        ok: result.ok,
        message: result.ok ? 'Connection successful' : result.message,
        models: models.map((m) => ({ id: m.id, name: m.name, description: m.description })),
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Provider connection test failed', { error });
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * 测试已保存的 Provider
   */
  async testSavedProvider(
    accountUuid: string,
    providerUuid: string,
  ): Promise<TestAIProviderConnectionResponse> {
    const provider = await this.providerRepository.findByUuid(providerUuid);
    if (!provider || provider.accountUuid !== accountUuid) {
      throw new Error('Provider not found');
    }

    return this.testConnection({
      providerType: provider.providerType,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
    });
  }

  /**
   * 刷新 Provider 的模型列表
   */
  async refreshModels(
    accountUuid: string,
    providerUuid: string,
  ): Promise<{ models: AIModelInfo[]; updatedAt: number }> {
    // 1. 获取 Provider
    const providerDTO = await this.providerRepository.findByUuid(providerUuid);
    if (!providerDTO || providerDTO.accountUuid !== accountUuid) {
      throw new Error('Provider not found');
    }

    // 2. 获取模型列表
    const models = await this.fetchModels(
      providerDTO.providerType,
      providerDTO.baseUrl,
      providerDTO.apiKey,
    );

    // 3. 更新 Provider
    const provider = AIProviderConfigServer.fromServerDTO(providerDTO);
    provider.updateAvailableModels(models);
    await this.providerRepository.save(provider.toServerDTO());

    logger.info('Provider models refreshed', {
      accountUuid,
      providerUuid,
      modelCount: models.length,
    });

    return {
      models,
      updatedAt: Date.now(),
    };
  }

  /**
   * 获取 Provider 的模型列表（公开方法，用于配置过程中获取模型）
   * 不需要保存 Provider 配置即可调用
   */
  async fetchModelsFromProvider(
    providerType: AIProviderType,
    baseUrl: string,
    apiKey: string,
  ): Promise<{ models: AIModelInfo[]; success: boolean; error?: string }> {
    try {
      const models = await this.fetchModels(providerType, baseUrl, apiKey);
      return {
        models,
        success: true,
      };
    } catch (error) {
      logger.error('Failed to fetch models from provider', { error, providerType });
      return {
        models: this.getDefaultModels(providerType),
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch models',
      };
    }
  }

  /**
   * 获取 Provider 的模型列表
   * 注意：这是一个简化实现，不同 Provider 可能有不同的 API
   */
  private async fetchModels(
    providerType: AIProviderType,
    baseUrl: string,
    apiKey: string,
  ): Promise<AIModelInfo[]> {
    try {
      // OpenAI 兼容 API 的 /models 端点
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        logger.warn('Failed to fetch models', {
          status: response.status,
          providerType,
        });
        return this.getDefaultModels(providerType);
      }

      const data = (await response.json()) as { data?: any; models?: any };
      const models = data.data || data.models || [];

      return models.map((m: any) => ({
        id: m.id,
        name: m.id, // OpenAI API 通常只有 id
        description: m.description || undefined,
        contextWindow: m.context_length || m.context_window || undefined,
      }));
    } catch (error) {
      logger.warn('Failed to fetch models, using defaults', { error, providerType });
      return this.getDefaultModels(providerType);
    }
  }

  /**
   * 获取默认模型列表（当 API 不可用时）
   */
  private getDefaultModels(providerType: AIProviderType): AIModelInfo[] {
    switch (providerType) {
      case AIProviderType.OPENAI:
        return [
          { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        ];
      case AIProviderType.QINIU:
        return [
          { id: 'deepseek-v3', name: 'DeepSeek V3' },
          { id: 'deepseek-chat', name: 'DeepSeek Chat' },
          { id: 'qwen-plus', name: 'Qwen Plus' },
        ];
      case AIProviderType.ANTHROPIC:
        return [
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
          { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
          { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
        ];
      default:
        return [{ id: 'default', name: 'Default Model' }];
    }
  }

  /**
   * 获取 Provider 的 AI 适配器
   * 用于动态切换用户自定义 Provider
   */
  async getAdapterForProvider(providerUuid: string, accountUuid: string): Promise<IAIAdapter> {
    const provider = await this.providerRepository.findByUuid(providerUuid);
    if (!provider) {
      throw new Error('Provider not found');
    }

    if (provider.accountUuid !== accountUuid) {
      throw new Error('Provider does not belong to this account');
    }

    if (!provider.isActive) {
      throw new Error('Provider is not active');
    }

    if (!this.adapterFactory) throw new Error('Adapter Factory not injected');
    return this.adapterFactory(provider);
  }
}

/**
 * 便捷函数：创建 Provider
 */
export const createProvider = (
  accountUuid: string,
  request: CreateAIProviderRequest,
): ReturnType<AIProviderConfigService['createProvider']> =>
  AIProviderConfigService.getInstance().createProvider(accountUuid, request);

/**
 * 便捷函数：更新 Provider
 */
export const updateProvider = (
  uuid: string,
  request: UpdateAIProviderRequest,
): ReturnType<AIProviderConfigService['updateProvider']> =>
  AIProviderConfigService.getInstance().updateProvider(uuid, request);

/**
 * 便捷函数：删除 Provider
 */
export const deleteProvider = (
  uuid: string,
): ReturnType<AIProviderConfigService['deleteProvider']> =>
  AIProviderConfigService.getInstance().deleteProvider(uuid);

/**
 * 便捷函数：获取 Provider
 */
export const getProvider = (uuid: string): ReturnType<AIProviderConfigService['getProvider']> =>
  AIProviderConfigService.getInstance().getProvider(uuid);

/**
 * 便捷函数：列出 Providers
 */
export const listProviders = (
  accountUuid: string,
): ReturnType<AIProviderConfigService['listProviders']> =>
  AIProviderConfigService.getInstance().listProviders(accountUuid);

/**
 * 便捷函数：测试连接
 */
export const testConnection = (
  request: TestAIProviderConnectionRequest,
): ReturnType<AIProviderConfigService['testConnection']> =>
  AIProviderConfigService.getInstance().testConnection(request);
