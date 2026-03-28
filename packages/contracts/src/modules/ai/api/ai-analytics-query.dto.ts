import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';

export const QueryAnalyticsSchema = z.object({
  query: z.string().trim().min(3).max(2000),
  providerId: brandedId<AiProviderConfigId>().optional(),
});

export type QueryAnalyticsReq = z.infer<typeof QueryAnalyticsSchema>;

export interface QueryAnalyticsRes {
  answer: string;
  highlights: string[];
  providerId: AiProviderConfigId;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTimeMs: number;
}
