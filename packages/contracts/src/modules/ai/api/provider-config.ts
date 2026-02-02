import { z } from 'zod';
import type { AIProviderConfigServerDTO } from '../aggregates/ai-provider-config-server';

// ============ AI Provider 配置 ============

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

// ============ 测试 Provider ============

export const TestAIProviderSchema = z.object({
  providerId: z.string().uuid(),
  testPrompt: z.string().optional().default('Hello, this is a test.'),
});

export type TestAIProviderReq = z.infer<typeof TestAIProviderSchema>;

export interface TestAIProviderRes {
  success: boolean;
  response?: string;
  error?: string;
  latencyMs: number;
}
