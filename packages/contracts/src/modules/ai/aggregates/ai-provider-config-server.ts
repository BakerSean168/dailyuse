/**
 * AI Provider Config Server DTO
 * 用户自定义 AI 服务提供商配置（服务端视图）
 */

import type { AiProviderConfigId, IdentityId, PersistenceDate, TransferDate, DomainDate } from '@/primitives';
import type { AIProviderType } from '../value-objects/ai-provider-type';
import type { AIModelInfo } from './ai-provider-config-client';


export interface AIProviderConfigServer  {

  id: AiProviderConfigId;
  identityId: IdentityId;

  name: string;

  providerType: AIProviderType;

  baseUrl: string;

  apiKey: string;

  defaultModel: string | null;

  availableModels: AIModelInfo[];

  isActive: boolean;
  isDefault: boolean;
  priority: number;

  createdAt: DomainDate;
  updatedAt: DomainDate;

}

export interface AIProviderConfigPersistenceDTO {
  id: string;
  identityId: string;

  name: string;

  providerType: AIProviderType;
  baseUrl: string;
  apiKey: string;
  defaultModel: string | null;
  availableModels: AIModelInfo[]
  isActive: boolean;

  isDefault: boolean;
  priority: number;

  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}

/**
 * AI Provider 配置 - 服务端 DTO
 * 包含完整的 API Key（加密存储）
 */
export interface AIProviderConfigServerDTO {
  /** 唯一标识符 */
  id: AiProviderConfigId;
  /** 所属账户 ID */
  identityId: IdentityId;
  /** 配置名称 */
  name: string;
  /** 提供商类型 */
  providerType: AIProviderType;
  /** API 基础地址 */
  baseUrl: string;
  /** API Key（服务端完整存储，加密） */
  apiKey: string;
  /** 默认使用的模型 ID */
  defaultModel: string | null;
  /** 可用模型列表（缓存） */
  availableModels: AIModelInfo[];
  /** 是否启用 */
  isActive: boolean;
  /** 是否为默认 Provider */
  isDefault: boolean;
  /** 优先级（数字越小优先级越高，用于故障转移） */
  priority: number;
  /** 创建时间戳 */
  createdAt: TransferDate;
  /** 更新时间戳 */
  updatedAt: TransferDate;
}
