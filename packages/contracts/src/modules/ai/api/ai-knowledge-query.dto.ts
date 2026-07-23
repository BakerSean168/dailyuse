import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import { QueryKnowledgeResSchema } from './response-schemas';

export const QueryKnowledgeSchema = z.object({
  query: z.string().trim().min(3).max(2000),
  providerId: brandedId<AiProviderConfigId>().optional(),
  maxResources: z.number().int().min(1).max(20).optional(),
});

export type QueryKnowledgeReq = z.infer<typeof QueryKnowledgeSchema>;

export const KnowledgeCitationSchema = z.object({
  resourceId: z.string().min(1),
  resourcePath: z.string().min(1),
  title: z.string().optional(),
  chunkIndex: z.number().int().nonnegative(),
  excerpt: z.string().min(1),
  score: z.number().nonnegative(),
});

export type KnowledgeCitation = z.infer<typeof KnowledgeCitationSchema>;

// Residual 695: response dual body retired — OpenAPI + transport use QueryKnowledgeResSchema.
export type QueryKnowledgeRes = z.infer<typeof QueryKnowledgeResSchema>;

export const ReindexKnowledgeSchema = z.object({
  limit: z.number().int().min(1).max(500).default(200).optional(),
  force: z.boolean().default(false).optional(),
  resourceIds: z.array(z.string().min(1)).min(1).max(100).optional(),
});

export type ReindexKnowledgeReq = z.infer<typeof ReindexKnowledgeSchema>;

export const ReindexKnowledgeResultItemSchema = z.object({
  resourceId: z.string().min(1),
  resourcePath: z.string().min(1),
  status: z.enum(['indexed', 'reused', 'failed']),
  error: z.string().optional(),
});

export interface ReindexKnowledgeRes {
  indexedCount: number;
  reusedCount: number;
  failedCount: number;
  results: Array<z.infer<typeof ReindexKnowledgeResultItemSchema>>;
}
