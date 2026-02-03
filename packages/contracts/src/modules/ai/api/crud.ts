/**
 * AI Module - API Contracts (CRUD + Operations)
 * 
 * 【规范说明：API 层导出】
 * 使用 Zod Schema 定义所有请求，类型通过 z.infer 推导
 * 响应类型明确指向 DTO（aggregates/entities/dtos）
 */

import { z } from 'zod';
import type { AIProviderConfigServerDTO } from '../aggregates/ai-provider-config-server';
import type {
  GoalCategory,
  GenerateGoalResultDTO,
  GenerateKeyResultsResultDTO,
  GenerateTasksResultDTO,
  KnowledgeGenerationResultDTO,
  SummarizationResultDTO,
  TestAIProviderResultDTO,
} from '../dtos';

// ============================================================================
// GOAL Generation Operations
// ============================================================================

/**
 * 生成目标 Schema
 */
export const GenerateGoalSchema = z.object({
  idea: z.string().min(10, '想法描述至少需要 10 个字符'),
  category: z.enum(['work', 'health', 'learning', 'personal', 'finance', 'relationship', 'other']).optional(),
  timeframe: z.object({
    startDate: z.number().int().optional(),
    endDate: z.number().int().optional(),
  }).optional(),
  context: z.string().optional(),
  providerId: z.string().uuid().optional(),
  includeKeyResults: z.boolean().optional().default(false),
  keyResultCount: z.number().int().min(3).max(5).optional().default(3),
});

export type GenerateGoalReq = z.infer<typeof GenerateGoalSchema>;
export type GenerateGoalRes = GenerateGoalResultDTO;

/**
 * 生成 Key Results Schema
 */
export const GenerateKeyResultsSchema = z.object({
  goalId: z.string().uuid(),
  goalTitle: z.string(),
  goalDescription: z.string().optional(),
  count: z.number().int().min(3).max(5).optional().default(3),
  providerId: z.string().uuid().optional(),
});

export type GenerateKeyResultsReq = z.infer<typeof GenerateKeyResultsSchema>;
export type GenerateKeyResultsRes = GenerateKeyResultsResultDTO;

// ============================================================================
// TASK Generation Operations
// ============================================================================

/**
 * 生成任务 Schema
 */
export const GenerateTasksSchema = z.object({
  goalId: z.string().uuid().optional(),
  keyResultId: z.string().uuid().optional(),
  description: z.string().min(10),
  context: z.string().optional(),
  taskCount: z.number().int().min(1).max(10).optional().default(5),
  providerId: z.string().uuid().optional(),
});

export type GenerateTasksReq = z.infer<typeof GenerateTasksSchema>;
export type GenerateTasksRes = GenerateTasksResultDTO;

// ============================================================================
// KNOWLEDGE Operations
// ============================================================================

/**
 * 知识库生成 Schema
 */
export const KnowledgeGenerationSchema = z.object({
  sources: z.array(z.object({
    type: z.enum(['document', 'url', 'text']),
    content: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })).min(1),
  extractionType: z.enum(['summary', 'keypoints', 'qa', 'full']),
  providerId: z.string().uuid().optional(),
});

export type KnowledgeGenerationReq = z.infer<typeof KnowledgeGenerationSchema>;
export type KnowledgeGenerationRes = KnowledgeGenerationResultDTO;

/**
 * 文本摘要 Schema
 */
export const SummarizationSchema = z.object({
  text: z.string().min(100, '文本至少需要 100 个字符'),
  maxLength: z.number().int().min(50).max(1000).optional(),
  language: z.enum(['zh-CN', 'en-US']).optional().default('zh-CN'),
  providerId: z.string().uuid().optional(),
});

export type SummarizationReq = z.infer<typeof SummarizationSchema>;
export type SummarizationRes = SummarizationResultDTO;

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
export type GetAIProviderConfigsReq = void;

export interface GetAIProviderConfigsRes {
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
  providerId: z.string().uuid(),
  testPrompt: z.string().optional().default('Hello, this is a test.'),
});

export type TestAIProviderReq = z.infer<typeof TestAIProviderSchema>;
export type TestAIProviderRes = TestAIProviderResultDTO;

// ============================================================================
// Re-export GoalCategory enum for convenience
// ============================================================================

export { GoalCategory } from '../dtos';
