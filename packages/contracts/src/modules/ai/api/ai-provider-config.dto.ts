/**
 * AI Provider Configuration Operations
 * 
 * This file contains DTOs for managing AI provider configurations.
 * Allows configuring multiple AI providers (OpenAI, Anthropic, etc.) and testing connections.
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { AiProviderConfigId } from '@/primitives';
import type { AIProviderConfigServerDTO } from '../aggregates/ai-provider-config-server';
import type { TestAIProviderResultDTO } from '../dtos';

// ============================================================================
// AI PROVIDER Configuration Operations
// ============================================================================

/**
 * 创建 AI Provider 配置 Schema
 */
export const CreateAIProviderConfigSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.enum(['openai', 'anthropic', 'google', 'azure', 'custom']),
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
  model: z.string(),
  isDefault: z.boolean().optional().default(false),
  maxTokens: z.number().int().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export type CreateAIProviderConfigReq = z.infer<typeof CreateAIProviderConfigSchema>;
export type CreateAIProviderConfigRes = AIProviderConfigServerDTO;

/**
 * 更新 AI Provider 配置 Schema
 */
export const UpdateAIProviderConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(1).optional(),
  baseUrl: z.string().url().optional(),
  model: z.string().optional(),
  isDefault: z.boolean().optional(),
  maxTokens: z.number().int().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateAIProviderConfigReq = z.infer<typeof UpdateAIProviderConfigSchema>;
export type UpdateAIProviderConfigRes = AIProviderConfigServerDTO;

/**
 * 获取 AI Provider 配置列表
 */
export type ListAIProviderConfigsReq = void;

export interface ListAIProviderConfigsRes {
  data: AIProviderConfigServerDTO[];
  total: number;
}

/**
 * 获取单个 AI Provider 配置
 */
export type GetAIProviderConfigReq = void;
export type GetAIProviderConfigRes = AIProviderConfigServerDTO;

/**
 * 删除 AI Provider 配置
 */
export type DeleteAIProviderConfigReq = void;
export type DeleteAIProviderConfigRes = void;

/**
 * 测试 AI Provider Schema
 */
export const TestAIProviderSchema = z.object({
  providerId: brandedId<AiProviderConfigId>(),
  testPrompt: z.string().optional().default('Hello, this is a test.'),
});

export type TestAIProviderReq = z.infer<typeof TestAIProviderSchema>;
export type TestAIProviderRes = TestAIProviderResultDTO;

/**
 * Refresh Provider Models - refreshes the available model list for a provider
 */
export type RefreshProviderModelsReq = void;
export interface RefreshProviderModelsRes {
  models: import('../aggregates/ai-provider-config-client').AIModelInfo[];
}
