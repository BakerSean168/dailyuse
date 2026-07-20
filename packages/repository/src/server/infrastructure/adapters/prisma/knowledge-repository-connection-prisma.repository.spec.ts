import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@dailyuse/database';
import { KnowledgeRepositoryConnectionPrismaRepository } from './knowledge-repository-connection-prisma.repository';

describe('KnowledgeRepositoryConnectionPrismaRepository', () => {
  it('pages projection candidates by stable updated-at and id ordering', async () => {
    const findMany = vi.fn(async () => []);
    const repository = new KnowledgeRepositoryConnectionPrismaRepository({
      knowledgeRepositoryConnection: { findMany },
    } as unknown as PrismaClient);
    const updatedAt = Date.parse('2026-07-19T18:00:00.000Z');

    await repository.listProjectionCandidates(50, { updatedAt, id: 'connection-50' });

    expect(findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        AND: [
          {
            OR: [
              { status: 'Active' },
              { status: 'Error', lastErrorCode: 'GITHUB_FORCE_PUSH_REQUIRES_RECONCILIATION' },
            ],
          },
          {
            OR: [
              { updatedAt: { gt: new Date(updatedAt) } },
              { updatedAt: new Date(updatedAt), id: { gt: 'connection-50' } },
            ],
          },
        ],
      },
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: 50,
    });
  });
});
