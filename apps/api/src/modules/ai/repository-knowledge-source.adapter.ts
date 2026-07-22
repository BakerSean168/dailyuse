import { createHash } from 'node:crypto';
import type { IKnowledgeSourcePort, KnowledgeSourceNote } from '@dailyuse/ai/ports';
import type { PrismaClient } from '@dailyuse/database';

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9\u4e00-\u9fff_]+/g) ?? []).filter(
    (token) => token.length > 1,
  );
}

function scoreNote(resource: KnowledgeSourceNote, query: string): number {
  const tokens = new Set(tokenize(query));
  const haystack =
    `${resource.title ?? ''} ${resource.resourcePath} ${resource.content}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 1;
  }
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery && (resource.title ?? '').toLowerCase().includes(normalizedQuery)) score += 2;
  return score;
}

/**
 * AI reads the GitHub-derived projection, never the legacy database resource
 * table. The projection remains rebuildable from the repository default branch.
 */
export class RepositoryKnowledgeSourceAdapter implements IKnowledgeSourcePort {
  constructor(
    private readonly db: PrismaClient,
    _storageBaseDir?: string,
  ) {}

  async listRelevantNotes(
    identityId: string,
    query: string,
    limit: number,
  ): Promise<KnowledgeSourceNote[]> {
    const resources = await this.loadNotes(identityId, limit * 3);
    return resources
      .map((resource) => ({ resource, score: scoreNote(resource, query) }))
      .filter(({ score }) => score > 0 || query.trim().length === 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ resource }) => resource);
  }

  async listIndexableNotes(
    identityId: string,
    limit: number,
  ): Promise<KnowledgeSourceNote[]> {
    return this.loadNotes(identityId, limit);
  }

  async getNoteById(
    identityId: string,
    resourceId: string,
  ): Promise<KnowledgeSourceNote | null> {
    const row = await this.db.knowledgeNoteProjection.findFirst({
      where: {
        id: resourceId,
        deletedAt: null,
        connection: { identityId, deletedAt: null, status: { in: ['Active', 'Suspended'] } },
      },
    });
    return row ? this.toKnowledgeNote(identityId, row) : null;
  }

  private async loadNotes(
    identityId: string,
    limit: number,
  ): Promise<KnowledgeSourceNote[]> {
    const rows = await this.db.knowledgeNoteProjection.findMany({
      where: {
        deletedAt: null,
        connection: { identityId, deletedAt: null, status: { in: ['Active', 'Suspended'] } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => this.toKnowledgeNote(identityId, row));
  }

  private toKnowledgeNote(
    identityId: string,
    row: {
      id: string;
      connectionId: string;
      relativePath: string;
      markdownContent: string;
      frontmatter: unknown;
      blobSha: string;
      contentHash: string;
      indexStatus: string;
    },
  ): KnowledgeSourceNote {
    const frontmatter =
      row.frontmatter && typeof row.frontmatter === 'object' && !Array.isArray(row.frontmatter)
        ? (row.frontmatter as Record<string, unknown>)
        : {};
    const title =
      typeof frontmatter['title'] === 'string'
        ? frontmatter['title']
        : (row.relativePath.split('/').slice(-1)[0]?.replace(/\.md$/i, '') ?? row.relativePath);
    const contentHash =
      row.contentHash || createHash('sha256').update(row.markdownContent).digest('hex');
    return {
      identityId,
      repositoryId: row.connectionId,
      resourceId: row.id,
      resourcePath: row.relativePath,
      title,
      mimeType: 'text/markdown',
      content: row.markdownContent,
      metadata: {
        frontmatter,
        blobSha: row.blobSha,
        contentHash,
        contentDigest: contentHash,
        projectionIndexStatus: row.indexStatus,
        sourceType: 'github-default-branch-projection',
      },
    };
  }
}
