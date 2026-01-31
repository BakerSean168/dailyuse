/**
 * AI Provider Config Request DTOs
 * AI 服务提供商配置请求
 */

import type { AIProviderType } from '../value-objects/ai-provider-type';

/**
 * 创建 AI Provider 请求
 */
export interface CreateAIProviderRequest {
  /** 配置名称（唯一，如 "我的七牛云"） */
  name: string;
  /** 提供商类型 */
  providerType: AIProviderType;
  /** API 基础地址（如 https://openai.qiniu.com/v1） */
  baseUrl: string;
  /** API Key */
  apiKey: string;
  /** 默认模型（可选，后续可通过 models 列表选择） */
  defaultModel?: string;
  /** 是否设为默认 Provider */
  setAsDefault?: boolean;
}

/**
 * 更新 AI Provider 请求
 */
export interface UpdateAIProviderRequest {
  /** 配置名称（可选） */
  name?: string;
  /** API 基础地址（可选） */
  baseUrl?: string;
  /** API Key（可选，只在需要更新时提供） */
  apiKey?: string;
  /** 默认模型（可选） */
  defaultModel?: string;
  /** 是否启用（可选） */
  isActive?: boolean;
  /** 是否设为默认（可选） */
  isDefault?: boolean;
}

/**
 * 测试 AI Provider 连接请求
 * 用于在保存之前测试连接
 */
export interface TestAIProviderConnectionRequest {
  /** 提供商类型 */
  providerType: AIProviderType;
  /** API 基础地址 */
  baseUrl: string;
  /** API Key */
  apiKey: string;
}

/**
 * 测试 AI Provider 连接响应
 */
export interface TestAIProviderConnectionResponse {
  /** 是否连接成功 */
  ok: boolean;
  /** 消息（成功或错误信息） */
  message: string;
  /** 可用模型列表（成功时返回） */
  models?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  /** 响应延迟（毫秒） */
  latencyMs?: number;
}

/**
 * 设置默认 Provider 请求
 */
export interface SetDefaultProviderRequest {
  /** Provider ID */
  providerId: string;
}

/**
 * 刷新 Provider 模型列表请求
 */
export interface RefreshProviderModelsRequest {
  /** Provider ID */
  providerId: string;
}

/**
 * 刷新 Provider 模型列表响应
 */
export interface RefreshProviderModelsResponse {
  /** 是否成功 */
  ok: boolean;
  /** 更新后的模型列表 */
  models: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  /** 更新时间 */
  updatedAt: number;
}
