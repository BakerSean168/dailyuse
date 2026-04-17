import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import type { ResourceClientDTO } from '../../repository/aggregates/resource-client';
import { KnowledgeNoteSubpathSchema } from '../../setting/preferences/schemas/ai.schema';

export const CreateKnowledgeNoteSchema = z.object({
  topic: z.string().trim().min(3).max(200),
  title: z.string().trim().min(1).max(200).optional(),
  providerId: brandedId<AiProviderConfigId>().optional(),
  model: z.string().trim().min(1).max(120).optional(),
  targetSubpath: KnowledgeNoteSubpathSchema.optional(),
});

export type CreateKnowledgeNoteReq = z.infer<typeof CreateKnowledgeNoteSchema>;

export interface CreateKnowledgeNoteRes {
  resource: ResourceClientDTO;
  resolvedPath: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: AiProviderConfigId;
  processingTimeMs: number;
  generatedAt: number;
}
