/**
 * AI Knowledge Operations
 * 
 * This file contains DTOs for AI-powered knowledge extraction and summarization.
 * Includes generating knowledge from documents and summarizing text content.
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import type { KnowledgeGenerationResultDTO, SummarizationResultDTO } from '../dtos';

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
  providerId: brandedId<AiProviderConfigId>().optional(),
});

export type KnowledgeGenerationReq = z.infer<typeof KnowledgeGenerationSchema>;
export type KnowledgeGenerationRes = KnowledgeGenerationResultDTO;

/**
 * 文本摘要 Schema
 */
export const SummarizationSchema = z.object({
  text: z.string().min(100, '文本至少需要 100 个字符'),
  maxLength: z.number().int().min(50).max(1000).optional(),
  language: z.enum(['zh-CN', 'en-US']).default('zh-CN').optional(),
  providerId: brandedId<AiProviderConfigId>().optional(),
});

export type SummarizationReq = z.infer<typeof SummarizationSchema>;
export type SummarizationRes = SummarizationResultDTO;
