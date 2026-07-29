import { describe, expect, it, vi } from 'vitest';

import type { PrismaClient } from '@memoflow/database';

import { AIKnowledgeIndexPrismaRepository } from '../ai-knowledge-index-prisma.repository';
import type { KnowledgeIndexedNote } from '../../../../application/ports';

const NOW = new Date('2026-03-27T00:00:00.000Z');

function createIndexedResource(
  overrides: Partial<KnowledgeIndexedNote> = {},
): KnowledgeIndexedNote {
  return {
    identityId: 'identity-1',
    repositoryId: 'repo-1',
    resourceId: 'resource-1',
    resourcePath: '/docs/alpha.md',
    title: 'Alpha',
    mimeType: 'text/markdown',
    contentHash: 'hash-1',
    summary: 'Alpha summary',
    keywords: ['alpha'],
    embedding: [0.1, 0.2],
    chunks: [
      {
        chunkIndex: 0,
        content: 'Alpha chunk',
        contentHash: 'chunk-hash-1',
        startOffset: 0,
        endOffset: 11,
        headingPath: ['Alpha'],
        keywords: ['alpha'],
        embedding: [0.3, 0.4],
      },
    ],
    metadata: { source: 'knowledge-test' },
    ...overrides,
  };
}

describe('AIKnowledgeIndexPrismaRepository', () => {
  it('uses pgvector candidate search when the retrieval vector column is available', async () => {
    const prisma = {
      $queryRaw: vi.fn(async () => [
        {
          id: 'entry-1',
          identityId: 'identity-1',
          repositoryId: 'repo-1',
          resourceId: 'resource-1',
          resourcePath: '/notes/python-ai.md',
          title: 'Python AI Grounding',
          mimeType: 'text/markdown',
          contentHash: 'hash-1',
          status: 'indexed',
          summary: 'Grounded answers should cite knowledge notes.',
          keywords: ['grounding', 'citation'],
          embedding: [0.1, 0.2],
          chunks: [],
          metadata: { source: 'knowledge-test' },
          error: null,
          indexedAt: NOW,
          lastRequestedAt: NOW,
          retrievalScore: 0.92,
        },
      ]),
      aiKnowledgeIndexEntry: {
        findMany: vi.fn(async () => []),
      },
      resource: {
        findMany: vi.fn(async () => []),
      },
    };

    const repository = new AIKnowledgeIndexPrismaRepository(prisma as unknown as PrismaClient);

    const result = await repository.findRelevantNotes(
      'identity-1',
      'How does grounding citation work?',
      5,
    );

    expect(result.map((resource) => resource.resourceId)).toEqual(['resource-1']);
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    expect(prisma.aiKnowledgeIndexEntry.findMany).not.toHaveBeenCalled();
  });

  it('retrieves relevant indexed resources only from the dedicated table', async () => {
    const prisma = {
      aiKnowledgeIndexEntry: {
        findMany: vi.fn(async () => [
          {
            id: 'entry-1',
            identityId: 'identity-1',
            repositoryId: 'repo-1',
            resourceId: 'resource-1',
            resourcePath: '/notes/python-ai.md',
            title: 'Python AI Grounding',
            mimeType: 'text/markdown',
            contentHash: 'hash-1',
            status: 'indexed',
            summary: 'Grounded answers should cite knowledge notes.',
            keywords: ['grounding', 'citation'],
            embedding: [0.1, 0.2],
            chunks: [],
            metadata: { source: 'knowledge-test' },
            error: null,
            indexedAt: NOW,
            lastRequestedAt: NOW,
          },
          {
            id: 'entry-2',
            identityId: 'identity-1',
            repositoryId: 'repo-1',
            resourceId: 'resource-2',
            resourcePath: '/notes/analytics.md',
            title: 'Analytics Overview',
            mimeType: 'text/markdown',
            contentHash: 'hash-2',
            status: 'indexed',
            summary: 'Dashboards summarize active goals.',
            keywords: ['analytics'],
            embedding: [0.3, 0.4],
            chunks: [],
            metadata: { source: 'knowledge-test' },
            error: null,
            indexedAt: NOW,
            lastRequestedAt: NOW,
          },
        ]),
      },
      resource: {
        findMany: vi.fn(async () => []),
      },
    };

    const repository = new AIKnowledgeIndexPrismaRepository(prisma as unknown as PrismaClient);

    const result = await repository.findRelevantNotes(
      'identity-1',
      'How does grounding citation work?',
      5,
    );

    expect(result.map((resource) => resource.resourceId)).toEqual(['resource-1']);
    expect(prisma.resource.findMany).not.toHaveBeenCalled();
  });

  it('disables pgvector retries after the first unsupported-query failure', async () => {
    const prisma = {
      $queryRaw: vi.fn(async () => {
        throw new Error('type "vector" does not exist');
      }),
      aiKnowledgeIndexEntry: {
        findMany: vi.fn(async () => [
          {
            id: 'entry-1',
            identityId: 'identity-1',
            repositoryId: 'repo-1',
            resourceId: 'resource-1',
            resourcePath: '/notes/python-ai.md',
            title: 'Python AI Grounding',
            mimeType: 'text/markdown',
            contentHash: 'hash-1',
            status: 'indexed',
            summary: 'Grounded answers should cite knowledge notes.',
            keywords: ['grounding', 'citation'],
            embedding: [0.1, 0.2],
            chunks: [],
            metadata: { source: 'knowledge-test' },
            error: null,
            indexedAt: NOW,
            lastRequestedAt: NOW,
          },
        ]),
      },
      resource: {
        findMany: vi.fn(async () => []),
      },
    };

    const repository = new AIKnowledgeIndexPrismaRepository(prisma as unknown as PrismaClient);

    const first = await repository.findRelevantNotes(
      'identity-1',
      'How does grounding citation work?',
      5,
    );
    const second = await repository.findRelevantNotes(
      'identity-1',
      'How does grounding citation work?',
      5,
    );

    expect(first.map((resource) => resource.resourceId)).toEqual(['resource-1']);
    expect(second.map((resource) => resource.resourceId)).toEqual(['resource-1']);
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    expect(prisma.aiKnowledgeIndexEntry.findMany).toHaveBeenCalledTimes(2);
    await expect(repository.getDiagnostics()).resolves.toEqual(
      expect.objectContaining({
        persistenceBackend: 'prisma-index-table',
        persistenceStatus: 'enabled',
        vectorRecallBackend: 'local-js-hybrid',
        vectorRecallStatus: 'fallback',
      }),
    );
  });

  it('reads indexed rows from the dedicated table and does not fall back for failed rows', async () => {
    const prisma = {
      aiKnowledgeIndexEntry: {
        findMany: vi.fn(async () => [
          {
            id: 'entry-1',
            identityId: 'identity-1',
            repositoryId: 'repo-1',
            resourceId: 'resource-1',
            resourcePath: '/docs/alpha.md',
            title: 'Alpha',
            mimeType: 'text/markdown',
            contentHash: 'hash-1',
            status: 'indexed',
            summary: 'Alpha summary',
            keywords: ['alpha'],
            embedding: [0.1, 0.2],
            chunks: [
              {
                chunkIndex: 0,
                content: 'Alpha chunk',
                contentHash: 'chunk-hash-1',
                startOffset: 0,
                endOffset: 11,
                headingPath: ['Alpha'],
                keywords: ['alpha'],
                embedding: [0.3, 0.4],
              },
            ],
            metadata: { source: 'knowledge-test' },
            error: null,
            indexedAt: NOW,
            lastRequestedAt: NOW,
          },
          {
            id: 'entry-2',
            identityId: 'identity-1',
            repositoryId: 'repo-1',
            resourceId: 'resource-2',
            resourcePath: '/docs/beta.md',
            title: 'Beta',
            mimeType: 'text/markdown',
            contentHash: 'hash-2',
            status: 'failed',
            summary: null,
            keywords: [],
            embedding: [],
            chunks: [],
            metadata: { source: 'knowledge-test' },
            error: 'ingestion failed',
            indexedAt: NOW,
            lastRequestedAt: NOW,
          },
        ]),
      },
      resource: {
        findMany: vi.fn(async () => [
          {
            id: 'resource-2',
            identityId: 'identity-1',
            repositoryId: 'repo-1',
            path: '/docs/beta.md',
            name: 'Beta',
            type: 'markdown',
            metadata: {
              aiKnowledgeIndex: {
                status: 'indexed',
                contentHash: 'legacy-hash',
                summary: 'Legacy beta summary',
                keywords: ['beta'],
                embedding: [0.7, 0.8],
                chunks: [],
                indexedAt: NOW.getTime(),
              },
            },
          },
        ]),
      },
    };

    const repository = new AIKnowledgeIndexPrismaRepository(prisma as unknown as PrismaClient);

    const result = await repository.findByNoteIds('identity-1', ['resource-1', 'resource-2']);

    expect(result).toEqual([
      expect.objectContaining({
        resourceId: 'resource-1',
        summary: 'Alpha summary',
      }),
    ]);
    expect(prisma.resource.findMany).not.toHaveBeenCalled();
  });

  it('surfaces dedicated-table failures without reading legacy resource metadata', async () => {
    const tableError = new Error('relation "ai_knowledge_index_entries" does not exist');
    const prisma = {
      aiKnowledgeIndexEntry: {
        findMany: vi.fn(async () => {
          throw tableError;
        }),
      },
      resource: {
        findMany: vi.fn(async () => []),
      },
    };

    const repository = new AIKnowledgeIndexPrismaRepository(prisma as unknown as PrismaClient);

    await expect(repository.findByNoteIds('identity-1', ['resource-1'])).rejects.toThrow(
      tableError.message,
    );

    expect(prisma.resource.findMany).not.toHaveBeenCalled();
    await expect(repository.getDiagnostics()).resolves.toEqual(
      expect.objectContaining({
        persistenceBackend: 'prisma-index-table',
        persistenceStatus: 'enabled',
      }),
    );
  });

  it('surfaces dedicated-table write failures without mutating Resource metadata', async () => {
    const tableError = new Error('dedicated knowledge index write failed');
    const prisma = {
      aiKnowledgeIndexEntry: {
        upsert: vi.fn(async () => {
          throw tableError;
        }),
      },
      resource: {
        findFirst: vi.fn(async () => ({ metadata: {} })),
        update: vi.fn(async () => undefined),
      },
    };
    const repository = new AIKnowledgeIndexPrismaRepository(prisma as unknown as PrismaClient);

    await expect(repository.upsert(createIndexedResource())).rejects.toThrow(tableError.message);

    expect(prisma.resource.findFirst).not.toHaveBeenCalled();
    expect(prisma.resource.update).not.toHaveBeenCalled();
  });

  it('writes indexed resources into the dedicated table with JSON payloads', async () => {
    const prisma = {
      $executeRaw: vi.fn(async () => 1),
      aiKnowledgeIndexEntry: {
        upsert: vi.fn(async () => undefined),
      },
    };

    const repository = new AIKnowledgeIndexPrismaRepository(prisma as unknown as PrismaClient);
    const resource = createIndexedResource();

    await repository.upsert(resource);

    expect(prisma.aiKnowledgeIndexEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { resourceId: 'resource-1' },
        create: expect.objectContaining({
          keywords: ['alpha'],
          embedding: [0.1, 0.2],
          chunks: [
            expect.objectContaining({
              content: 'Alpha chunk',
              embedding: [0.3, 0.4],
            }),
          ],
          metadata: { source: 'knowledge-test' },
          indexedAt: expect.any(Date),
          lastRequestedAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          keywords: ['alpha'],
          embedding: [0.1, 0.2],
          chunks: [
            expect.objectContaining({
              content: 'Alpha chunk',
              embedding: [0.3, 0.4],
            }),
          ],
          metadata: { source: 'knowledge-test' },
          indexedAt: expect.any(Date),
          lastRequestedAt: expect.any(Date),
        }),
      }),
    );
    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
  });

  it('clears stale retrieval payloads when persisting failed index entries', async () => {
    const prisma = {
      $executeRaw: vi.fn(async () => 1),
      aiKnowledgeIndexEntry: {
        upsert: vi.fn(async () => undefined),
      },
    };

    const repository = new AIKnowledgeIndexPrismaRepository(prisma as unknown as PrismaClient);

    await repository.markFailed({
      identityId: 'identity-1',
      repositoryId: 'repo-1',
      resourceId: 'resource-1',
      resourcePath: '/docs/alpha.md',
      title: 'Alpha',
      mimeType: 'text/markdown',
      contentHash: 'hash-1',
      metadata: { source: 'knowledge-test' },
      error: 'embedding timeout',
    });

    expect(prisma.aiKnowledgeIndexEntry.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          summary: null,
          keywords: [],
          embedding: [],
          chunks: [],
          error: 'embedding timeout',
        }),
      }),
    );
    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
  });
});
