import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';

function normalizeKnowledgeNoteTargetSubpath(value: string): string {
  return value
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
}

export const KnowledgeNoteTargetSubpathSchema = z
  .string()
  .trim()
  .max(120)
  .superRefine((value, ctx) => {
    const normalized = value.replace(/\\/g, '/').trim();
    if (/^[A-Za-z]:/.test(normalized) || normalized.startsWith('/')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Knowledge note path must be vault-relative',
      });
    }
    const segments = normalized
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.some((segment) => segment === '.' || segment === '..')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Knowledge note path cannot contain . or .. segments',
      });
    }
    if (segments.some((segment) => /[<>:"|?*]/.test(segment))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Knowledge note path contains invalid characters',
      });
    }
  })
  .transform(normalizeKnowledgeNoteTargetSubpath);

export const CreateKnowledgeNoteSchema = z.object({
  topic: z.string().trim().min(3).max(200),
  contentMarkdown: z.string().trim().min(3).max(50_000).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  providerId: brandedId<AiProviderConfigId>().optional(),
  model: z.string().trim().min(1).max(120).optional(),
  targetSubpath: KnowledgeNoteTargetSubpathSchema.optional(),
  connectionId: z.string().trim().min(1).optional(),
  confirmation: z.object({
    proposalId: z.string().trim().min(1),
    revision: z.number().int().min(1),
    requestId: z.string().trim().min(1),
  }),
});

export type CreateKnowledgeNoteReq = z.infer<typeof CreateKnowledgeNoteSchema>;

export type KnowledgeNoteIndexStatus = 'pending' | 'indexed' | 'failed';

/**
 * Persisted knowledge-note reference returned after confirmed create.
 * Not a database Resource CRUD DTO — scoped to vault/projection note writes.
 */
export interface KnowledgeNotePersistedRef {
  id: string;
  /** Knowledge connection id, or local-vault-{identityId} scope. */
  repositoryScopeId: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  content: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateKnowledgeNoteRes {
  note: KnowledgeNotePersistedRef;
  resolvedPath: string;
  indexStatus: KnowledgeNoteIndexStatus;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  providerId: AiProviderConfigId;
  processingTimeMs: number;
  generatedAt: number;
}
