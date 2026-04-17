import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import type {
  AIProviderConfigClientDTO,
  AIProviderConfigSummary,
} from '../aggregates/ai-provider-config-client';
import type { TestAIProviderResultDTO } from '../dtos/provider-test-result.dto';

export const OpenAICompatibleProviderType = 'openai_compatible' as const;

const ProviderBaseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  baseUrl: z.string().trim().url(),
  apiKey: z.string().trim().min(1),
  model: z.string().trim().min(1).max(120),
  isDefault: z.boolean().default(false).optional(),
});

export const CreateAIProviderConfigSchema = ProviderBaseSchema;
export type CreateAIProviderConfigReq = z.infer<typeof CreateAIProviderConfigSchema>;
export type CreateAIProviderConfigRes = AIProviderConfigClientDTO;

export const UpdateAIProviderConfigSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  baseUrl: z.string().trim().url().optional(),
  apiKey: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).max(120).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateAIProviderConfigReq = z.infer<typeof UpdateAIProviderConfigSchema>;
export type UpdateAIProviderConfigRes = AIProviderConfigClientDTO;

export interface ListAIProviderConfigsRes {
  data: AIProviderConfigSummary[];
}

export type GetAIProviderConfigReq = void;
export type GetAIProviderConfigRes = AIProviderConfigClientDTO;

export type DeleteAIProviderConfigReq = void;
export type DeleteAIProviderConfigRes = void;
export type RefreshAIProviderModelsReq = void;
export type RefreshAIProviderModelsRes = AIProviderConfigClientDTO;

export const TestAIProviderSchema = z
  .object({
    providerId: brandedId<AiProviderConfigId>().optional(),
    baseUrl: z.string().trim().url().optional(),
    apiKey: z.string().trim().min(1).optional(),
    model: z.string().trim().min(1).max(120).optional(),
    testPrompt: z.string().trim().min(1).default('Hello, this is a test.').optional(),
  })
  .refine(
    (value) => {
      if (value.providerId) {
        return true;
      }

      return Boolean(value.baseUrl && value.apiKey && value.model);
    },
    {
      message: 'Either providerId or baseUrl/apiKey/model is required',
      path: ['providerId'],
    },
  );
export type TestAIProviderReq = z.infer<typeof TestAIProviderSchema>;
export type TestAIProviderRes = TestAIProviderResultDTO;

export const SetDefaultAIProviderSchema = z.object({
  providerId: brandedId<AiProviderConfigId>(),
});
export type SetDefaultAIProviderReq = z.infer<typeof SetDefaultAIProviderSchema>;
export type SetDefaultAIProviderRes = void;
