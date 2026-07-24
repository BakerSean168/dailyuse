/**
 * Residual 969: sole knowledge-index value helpers for PowerSync + Prisma repositories.
 * toStringArray / toNumberArray / tokenize / toChunkArray duals retired.
 * Residual 1109 keep-boundary: toStringArray keeps empty strings (no trim).
 * Soft residual 1109: goal-planning trims/non-empty; data-portability parseJsonField first (no force-merge).
 * Residual 1195: scoreIndexedResource dual retired (Prisma semanticScore + PowerSync lexical).
 */

import type { KnowledgeIndexedChunk, KnowledgeIndexedNote } from '../../application/ports';

// Residual 1109 keep-boundary: array filter typeof string only (keeps empty; no trim; no JSON parse).
export function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export function toNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((item): item is number => typeof item === 'number')
    : [];
}

// Residual 1153 keep-boundary: knowledge-index tokenize — ASCII alnum + underscore only.
// Soft residual 1153: API repository-knowledge-source tokenize includes CJK (\u4e00-\u9fff) for projection search (no force-merge).
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9_]+/g) ?? []).filter((token) => token.length > 1);
}

export function toChunkArray(value: unknown): KnowledgeIndexedChunk[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const row = item as Record<string, unknown>;
      return {
        chunkIndex: typeof row.chunkIndex === 'number' ? row.chunkIndex : 0,
        content: typeof row.content === 'string' ? row.content : '',
        contentHash: typeof row.contentHash === 'string' ? row.contentHash : '',
        startOffset: typeof row.startOffset === 'number' ? row.startOffset : 0,
        endOffset: typeof row.endOffset === 'number' ? row.endOffset : 0,
        headingPath: toStringArray(row.headingPath),
        keywords: toStringArray(row.keywords),
        embedding: toNumberArray(row.embedding),
      } satisfies KnowledgeIndexedChunk;
    })
    .filter((item): item is KnowledgeIndexedChunk => item !== null && item.content.length > 0);
}

/**
 * Residual 1195: sole knowledge-index scoreIndexedResource.
 * Lexical keyword/path/title/summary scoring; optional semanticScore boost (Prisma hybrid).
 * Empty query → semanticScore if > 0 else 1.
 */
export function scoreIndexedResource(
  resource: KnowledgeIndexedNote,
  query: string,
  semanticScore = 0,
): number {
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery.length === 0) {
    return semanticScore > 0 ? semanticScore : 1;
  }

  const tokens = new Set(tokenize(trimmedQuery));
  const keywordSet = new Set(resource.keywords.map((keyword) => keyword.toLowerCase()));
  const haystack =
    `${resource.title ?? ''} ${resource.resourcePath} ${resource.summary} ${resource.keywords.join(' ')}`.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (keywordSet.has(token)) {
      score += 3;
      continue;
    }
    if (haystack.includes(token)) {
      score += 1;
    }
  }

  if ((resource.title ?? '').toLowerCase().includes(trimmedQuery)) {
    score += 3;
  }
  if (resource.resourcePath.toLowerCase().includes(trimmedQuery)) {
    score += 2;
  }
  if (resource.summary.toLowerCase().includes(trimmedQuery)) {
    score += 2;
  }

  return score + semanticScore * 4;
}

