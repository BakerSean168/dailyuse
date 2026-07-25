import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import { ExpandKnowledgeResSchema } from './response-schemas';

export const ExpandKnowledgeSchema = z.object({
  instruction: z.string().trim().min(3).max(2000),
  currentContent: z.string().trim().min(1).max(20000).optional(),
  providerId: brandedId<AiProviderConfigId>().optional(),
  maxResources: z.number().int().min(1).max(20).optional(),
  maxCitations: z.number().int().min(1).max(8).optional(),
});

export type ExpandKnowledgeReq = z.infer<typeof ExpandKnowledgeSchema>;

// Residual 695: response dual body retired — OpenAPI + transport use ExpandKnowledgeResSchema.
export type ExpandKnowledgeRes = z.infer<typeof ExpandKnowledgeResSchema>;
