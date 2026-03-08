/**
 * AI Provider Config Client DTO
 * 用户自定义 AI 服务提供商配置（客户端视图）
 */

import type { AiProviderConfigId, IdentityId } from '../../../primitives';
import type { AIProviderType } from '../value-objects/ai-provider-type';

/**
 * AI Provider 配置 - 客户端 DTO
 * 注意: apiKey 在客户端只显示掩码版本
 */
export interface AIProviderConfigClientDTO {
  /** 唯一标识符 */
  id: AiProviderConfigId;
  /** 所属身份 ID */
  identityId: IdentityId;
  /** 配置名称（用户自定义） */
  name: string;
  /** 提供商类型 */
  providerType: AIProviderType;
  /** API 基础地址 */
  baseUrl: string;
  /** API Key 掩码（前端展示用，如 "sk-****xxxx"） */
  apiKeyMasked: string;
  /** 默认使用的模型 ID */
  defaultModel: string | null;
  /** 可用模型列表（缓存） */
  availableModels: AIModelInfo[];
  /** 是否启用 */
  isActive: boolean;
  /** 是否为默认 Provider */
  isDefault: boolean;
  /** 排序优先级 */
  priority: number;
  /** 版本号（用于乐观锁） */
  version: number;
  /** 创建时间戳 */
  createdAt: number;
  /** 更新时间戳 */
  updatedAt: number;
  /** 软删除时间戳 */
  deletedAt: number | null;
}

/**
 * AI 模型信息
 */
export interface AIModelInfo {
  /** 模型 ID（用于 API 调用） */
  id: string;
  /** 模型显示名称 */
  name: string;
  /** 模型描述（可选） */
  description?: string;
  /** 上下文窗口大小（可选） */
  contextWindow?: number;
  /** 每百万输入 token 成本（美元） */
  inputCostPer1M?: number;
  /** 每百万输出 token 成本（美元） */
  outputCostPer1M?: number;
}

/**
 * AI Provider 配置摘要
 * 用于列表展示和选择器
 */
export interface AIProviderConfigSummary {
  id: AiProviderConfigId;
  name: string;
  providerType: AIProviderType;
  defaultModel: string | null;
  isActive: boolean;
  isDefault: boolean;
}
