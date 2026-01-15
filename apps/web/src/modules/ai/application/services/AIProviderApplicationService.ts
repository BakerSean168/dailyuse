/**
 * AI Provider Application Service
 * AI 服务提供商应用服务 - 负责 Provider 配置的 CRUD 操作
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 */

import type {
  AIProviderConfigClientDTO,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
} from '@dailyuse/contracts/ai';
import {
  aiProviderApiClient,
  type TestConnectionResponse,
} from '../../infrastructure/api/aiProviderApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIProviderApplicationService');

export class AIProviderApplicationService {
  private static instance: AIProviderApplicationService;

  private constructor() {}

  static getInstance(): AIProviderApplicationService {
    if (!AIProviderApplicationService.instance) {
      AIProviderApplicationService.instance = new AIProviderApplicationService();
    }
    return AIProviderApplicationService.instance;
  }

  /**
   * 获取 Provider 列表
   */
  async getProviders(): Promise<AIProviderConfigClientDTO[]> {
    logger.info('Fetching AI providers');
    const providers = await aiProviderApiClient.getProviders();
    logger.info('AI providers fetched', { count: providers.length });
    return providers;
  }

  /**
   * 创建 Provider
   */
  async createProvider(request: CreateAIProviderRequest): Promise<AIProviderConfigClientDTO> {
    logger.info('Creating AI provider', { name: request.name });
    const provider = await aiProviderApiClient.createProvider(request);
    logger.info('AI provider created', { uuid: provider.uuid });
    return provider;
  }

  /**
   * 更新 Provider
   */
  async updateProvider(
    uuid: string,
    request: UpdateAIProviderRequest,
  ): Promise<AIProviderConfigClientDTO> {
    logger.info('Updating AI provider', { uuid });
    const provider = await aiProviderApiClient.updateProvider(uuid, request);
    logger.info('AI provider updated', { uuid });
    return provider;
  }

  /**
   * 删除 Provider
   */
  async deleteProvider(uuid: string): Promise<void> {
    logger.info('Deleting AI provider', { uuid });
    await aiProviderApiClient.deleteProvider(uuid);
    logger.info('AI provider deleted', { uuid });
  }

  /**
   * 测试连接
   */
  async testConnection(uuid: string): Promise<TestConnectionResponse> {
    logger.info('Testing AI provider connection', { uuid });
    const result = await aiProviderApiClient.testConnection(uuid);
    logger.info('AI provider connection tested', { uuid, ok: result.ok });
    return result;
  }

  /**
   * 设为默认 Provider
   */
  async setDefaultProvider(uuid: string): Promise<AIProviderConfigClientDTO> {
    logger.info('Setting default AI provider', { uuid });
    const provider = await aiProviderApiClient.setDefaultProvider(uuid);
    logger.info('Default AI provider set', { uuid });
    return provider;
  }
}

export const aiProviderApplicationService = AIProviderApplicationService.getInstance();
