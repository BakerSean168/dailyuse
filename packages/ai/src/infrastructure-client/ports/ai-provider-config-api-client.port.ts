/**
 * AI Provider Config API Client Port Interface
 *
 * Defines the contract for AI Provider Configuration API operations.
 * Implementations: AIProviderConfigHttpAdapter (web), AIProviderConfigIpcAdapter (desktop)
 */

import type {
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
  TestAIProviderConnectionRequest,
  TestAIProviderConnectionResponse,
  RefreshProviderModelsResponse,
} from '@dailyuse/contracts/ai';

/**
 * AI Provider Config API Client Interface
 */
export interface IAIProviderConfigApiClient {
  // ===== Provider CRUD =====

  /** 创建 AI Provider 配置 */
  createProvider(request: CreateAIProviderRequest): Promise<AIProviderConfigClientDTO>;

  /** 获取所有 Provider 配置 */
  getProviders(): Promise<AIProviderConfigSummary[]>;

  /** 获取 Provider 详情 */
  getProviderById(uuid: string): Promise<AIProviderConfigClientDTO>;

  /** 更新 Provider 配置 */
  updateProvider(uuid: string, request: UpdateAIProviderRequest): Promise<AIProviderConfigClientDTO>;

  /** 删除 Provider 配置 */
  deleteProvider(uuid: string): Promise<void>;

  // ===== Provider Operations =====

  /** 测试 Provider 连接 */
  testConnection(request: TestAIProviderConnectionRequest): Promise<TestAIProviderConnectionResponse>;

  /** 设置默认 Provider */
  setDefaultProvider(uuid: string): Promise<void>;

  /** 刷新 Provider 模型列表 */
  refreshModels(uuid: string): Promise<RefreshProviderModelsResponse>;
}
