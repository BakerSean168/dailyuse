import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@dailyuse/database';
import { RepositoryKnowledgeSourceAdapter } from './repository-knowledge-source.adapter';

function projectionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'projection-1',
    connectionId: 'connection-1',
    relativePath: 'notes/architecture.md',
    markdownContent: '# Architecture\n\nRepository-backed knowledge.',
    frontmatter: { title: 'Architecture' },
    blobSha: 'a'.repeat(40),
    contentHash: 'b'.repeat(64),
    indexStatus: 'pending',
    ...overrides,
  };
}

describe('RepositoryKnowledgeSourceAdapter', () => {
  it('loads only identity-owned active projections and exposes the source digest for indexing', async () => {
    const findMany = vi.fn(async () => [
      projectionRow({
        id: 'projection-unrelated',
        relativePath: 'notes/unrelated.md',
        frontmatter: {},
        markdownContent: '# Other topic',
      }),
      projectionRow(),
    ]);
    const db = {
      knowledgeNoteProjection: {
        findMany,
        findFirst: vi.fn(),
      },
    } as unknown as PrismaClient;
    const adapter = new RepositoryKnowledgeSourceAdapter(db);

    const resources = await adapter.listRelevantResources('identity-1', 'architecture', 1);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        connection: {
          identityId: 'identity-1',
          deletedAt: null,
          status: { in: ['Active', 'Suspended'] },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });
    expect(resources).toEqual([
      expect.objectContaining({
        identityId: 'identity-1',
        repositoryId: 'connection-1',
        resourceId: 'projection-1',
        resourcePath: 'notes/architecture.md',
        title: 'Architecture',
        metadata: expect.objectContaining({
          contentDigest: 'b'.repeat(64),
          projectionIndexStatus: 'pending',
          sourceType: 'github-default-branch-projection',
        }),
      }),
    ]);
  });

  it('hydrates a requested projection through the same identity boundary', async () => {
    const findFirst = vi.fn(async () => projectionRow({ indexStatus: 'indexed' }));
    const db = {
      knowledgeNoteProjection: {
        findMany: vi.fn(),
        findFirst,
      },
    } as unknown as PrismaClient;
    const adapter = new RepositoryKnowledgeSourceAdapter(db);

    const resource = await adapter.getResourceById('identity-1', 'projection-1');

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'projection-1',
        deletedAt: null,
        connection: {
          identityId: 'identity-1',
          deletedAt: null,
          status: { in: ['Active', 'Suspended'] },
        },
      },
    });
    expect(resource?.metadata).toMatchObject({ projectionIndexStatus: 'indexed' });
  });
});
