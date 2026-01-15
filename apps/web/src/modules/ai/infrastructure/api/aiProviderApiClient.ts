/**
 * AI Provider API Client
 * AI 服务提供商配置 API 客户端
 *
 * 职责：
 * - 封装 AI Provider 配置相关的 HTTP 请求
 * - Provider CRUD 操作
 * - 连接测试
 */

import { apiClient } from '@/shared/api/instances';
import type {
  AIProviderConfigClientDTO,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
  AIModelInfo,
  AIProviderType,
} from '@dailyuse/contracts/ai';

/**
 * AI Provider API Response 类型
 * 注意：后端返回标准格式 { success, data, message }
 * apiClient.get 已自动提取 data 字段
 */
export type AIProviderListResponse = AIProviderConfigClientDTO[];

export type AIProviderResponse = AIProviderConfigClientDTO;

export interface TestConnectionResponse {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * 获取模型列表的响应
 */
export interface FetchModelsResponse {
  models: AIModelInfo[];
  ok: boolean;
  error?: string;
}

/**
 * 获取模型列表的请求参数
 */
export interface FetchModelsRequest {
  providerType: AIProviderType;
  baseUrl: string;
  apiKey: string;
}

/**
 * AI Provider API Client
 */
export class AIProviderApiClient {
  private readonly baseUrl = '/ai/providers';

  /**
   * 创建 AI Provider 配置
   * @returns 创建的 Provider 配置
   */
  async createProvider(request: CreateAIProviderRequest): Promise<AIProviderResponse> {
    const data = await apiClient.post<AIProviderResponse>(this.baseUrl, request);
    return data;
  }

  /**
   * 获取用户的 AI Provider 列表
   * @returns Provider 配置数组
   */
  async getProviders(): Promise<AIProviderListResponse> {
    const data = await apiClient.get<AIProviderListResponse>(this.baseUrl);
    // 确保返回数组，即使后端返回 null/undefined
    return data || [];
  }

  /**
   * 获取特定 Provider 详情
   * @returns Provider 配置
   */
  async getProvider(uuid: string): Promise<AIProviderResponse> {
    const data = await apiClient.get<AIProviderResponse>(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 更新 Provider 配置
   * @returns 更新后的 Provider 配置
   */
  async updateProvider(
    uuid: string,
    request: UpdateAIProviderRequest,
  ): Promise<AIProviderResponse> {
    const data = await apiClient.put<AIProviderResponse>(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除 Provider 配置
   */
  async deleteProvider(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  /**
   * 测试 Provider 连接
   */
  async testConnection(uuid: string): Promise<TestConnectionResponse> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/test`);
    return data;
  }

  /**
   * 设为默认 Provider
   */
  async setDefaultProvider(uuid: string): Promise<AIProviderResponse> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/set-default`);
    return data;
  }

  /**
   * 获取模型列表（配置过程中使用）
   * 不需要保存 Provider 配置即可调用
   * @param request 包含 providerType, baseUrl, apiKey
   * @returns 模型列表
   */
  async fetchModels(request: FetchModelsRequest): Promise<FetchModelsResponse> {
    const data = await apiClient.post<FetchModelsResponse>(`${this.baseUrl}/fetch-models`, request);
    return data || { models: [], ok: false, error: 'No response' };
  }
}

/**
 * 导出单例实例
 */
export const aiProviderApiClient = new AIProviderApiClient();
