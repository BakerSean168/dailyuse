import { z } from 'zod';
import type { TokenUsageClientDTO } from '../value-objects/token-usage';

// ============ 知识库生成 ============

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

export interface KnowledgeGenerationRes {
  content: string;
  metadata: Record<string, unknown>;
  tokenUsage: TokenUsageClientDTO;
  providerId: string;
  processingTimeMs: number;
}

// ============ 文本摘要 ============

export const SummarizationSchema = z.object({
  text: z.string().min(100, '文本至少需要 100 个字符'),
  maxLength: z.number().int().min(50).max(1000).optional(),
  language: z.enum(['zh-CN', 'en-US']).optional().default('zh-CN'),
  providerId: z.string().uuid().optional(),
});

export type SummarizationReq = z.infer<typeof SummarizationSchema>;

export interface SummarizationRes {
  summary: string;
  keyPoints?: string[];
  tokenUsage: TokenUsageClientDTO;
  providerId: string;
  processingTimeMs: number;
}
