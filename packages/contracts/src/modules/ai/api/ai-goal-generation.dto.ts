import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import type { GenerateGoalResultDTO } from '../dtos';

export const GenerateGoalsSchema = z.object({
  idea: z.string().trim().min(10, '描述至少需要 10 个字符'),
  category: z.string().trim().optional(),
  timeframe: z.string().trim().optional(),
  includeKeyResults: z.boolean().default(true).optional(),
  providerId: brandedId<AiProviderConfigId>().optional(),
});

export type GenerateGoalsReq = z.infer<typeof GenerateGoalsSchema>;
export type GenerateGoalsRes = GenerateGoalResultDTO;
