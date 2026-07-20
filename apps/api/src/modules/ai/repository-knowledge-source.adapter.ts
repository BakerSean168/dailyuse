import { createHash } from 'node:crypto';
import type { IKnowledgeSourcePort, KnowledgeSourceResource } from '@dailyuse/ai/ports';
import type { PrismaClient } from '@dailyuse/database';

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9\u4e00-\u9fff_]+/g) ?? []).filter(
    (token) => token.length > 1,
  );
}

function scoreResource(resource: KnowledgeSourceResource, query: string): number {
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

  async listRelevantResources(
    identityId: string,
    query: string,
    limit: number,
  ): Promise<KnowledgeSourceResource[]> {
    const resources = await this.loadResources(identityId, limit * 3);
    return resources
      .map((resource) => ({ resource, score: scoreResource(resource, query) }))
      .filter(({ score }) => score > 0 || query.trim().length === 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ resource }) => resource);
  }

  async listIndexableResources(
    identityId: string,
    limit: number,
  ): Promise<KnowledgeSourceResource[]> {
    return this.loadResources(identityId, limit);
  }

  async getResourceById(
    identityId: string,
    resourceId: string,
  ): Promise<KnowledgeSourceResource | null> {
    const row = await this.db.knowledgeNoteProjection.findFirst({
      where: {
        id: resourceId,
        deletedAt: null,
        connection: { identityId, deletedAt: null, status: { in: ['Active', 'Suspended'] } },
      },
    });
    return row ? this.toResource(identityId, row) : null;
  }

  private async loadResources(
    identityId: string,
    limit: number,
  ): Promise<KnowledgeSourceResource[]> {
    const rows = await this.db.knowledgeNoteProjection.findMany({
      where: {
        deletedAt: null,
        connection: { identityId, deletedAt: null, status: { in: ['Active', 'Suspended'] } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => this.toResource(identityId, row));
  }

  private toResource(
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
  ): KnowledgeSourceResource {
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
