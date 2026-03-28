import { z } from 'zod';

function normalizeKnowledgeNoteSubpath(value: string): string {
  return value
    .replace(/\\/g, '/')
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
}

const RawKnowledgeNoteSubpathSchema = z.string().trim().max(120);

export const KnowledgeNoteSubpathSchema = RawKnowledgeNoteSubpathSchema.superRefine(
  (value, ctx) => {
    const normalized = value.replace(/\\/g, '/').trim();

    if (/^[A-Za-z]:/.test(normalized) || normalized.startsWith('/')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Knowledge note path must be relative to notes/',
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
  },
).transform(normalizeKnowledgeNoteSubpath);

export const AISchema = z.object({
  knowledgeNoteSubpath: KnowledgeNoteSubpathSchema.default(''),
});
