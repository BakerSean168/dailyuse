/**
 * AI Provider Config Client DTO
 * 用户自定义 AI 服务提供商配置（客户端视图）
 *
 * Residual 751: AIModelInfo dual body retired — sole AIModelInfoSchema + z.infer.
 * Residual 811: AIProviderConfigClientDTO dual retired — sole ClientDTOSchema + z.infer
 * (identityId branded; apiKey only masked).
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId, IdentityId } from '../../../primitives';
import { AIProviderType } from '../value-objects/ai-provider-type';

// Residual 751: AIModelInfo dual body retired — OpenAPI + transport use
// AIModelInfoSchema (semantic type is a z.infer alias).

export const AIModelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  contextWindow: z.number().optional(),
  inputCostPer1M: z.number().optional(),
  outputCostPer1M: z.number().optional(),
});

export type AIModelInfo = z.infer<typeof AIModelInfoSchema>;

// Residual 811: AIProviderConfigClientDTO dual retired — sole ClientDTOSchema + z.infer.
// Note: apiKey is masked only on the client view.
export const AIProviderConfigClientDTOSchema = z.object({
  id: brandedId<AiProviderConfigId>(),
  identityId: brandedId<IdentityId>(),
  name: z.string(),
  providerType: z.enum(Object.values(AIProviderType)),
  baseUrl: z.string(),
  apiKeyMasked: z.string(),
  defaultModel: z.string().nullable(),
  availableModels: z.array(AIModelInfoSchema),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  priority: z.number(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
});

export type AIProviderConfigClientDTO = z.infer<typeof AIProviderConfigClientDTOSchema>;
