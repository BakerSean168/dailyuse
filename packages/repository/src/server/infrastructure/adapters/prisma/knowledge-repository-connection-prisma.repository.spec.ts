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

  it('creates when the connection id is absent', async () => {
    const findUnique = vi.fn(async () => null);
    const create = vi.fn(async () => undefined);
    const updateMany = vi.fn();
    const repository = new KnowledgeRepositoryConnectionPrismaRepository({
      knowledgeRepositoryConnection: { findUnique, create, updateMany },
    } as unknown as PrismaClient);

    await repository.save({
      id: 'connection-1',
      identityId: 'identity-1',
      githubUserId: 'github-user-1',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'acme/notes',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Active',
      lastSyncedCommitSha: null,
      lastProjectedCommitSha: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      version: 1,
      createdAt: 1_750_000_000_000 as never,
      updatedAt: 1_750_000_000_000 as never,
      deletedAt: null,
    });

    expect(create).toHaveBeenCalledOnce();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('updates only when id + identityId match and never rewrites identityId', async () => {
    const findUnique = vi.fn(async () => ({ identityId: 'identity-1' }));
    const create = vi.fn();
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const repository = new KnowledgeRepositoryConnectionPrismaRepository({
      knowledgeRepositoryConnection: { findUnique, create, updateMany },
    } as unknown as PrismaClient);

    await repository.save({
      id: 'connection-1',
      identityId: 'identity-1',
      githubUserId: 'github-user-1',
      githubRepositoryId: 'repository-1',
      githubRepositoryFullName: 'acme/notes',
      installationId: 'installation-1',
      defaultBranch: 'main',
      status: 'Active',
      lastSyncedCommitSha: 'sha-1',
      lastProjectedCommitSha: 'sha-1',
      lastErrorCode: null,
      lastErrorMessage: null,
      version: 2,
      createdAt: 1_750_000_000_000 as never,
      updatedAt: 1_750_000_100_000 as never,
      deletedAt: null,
    });

    expect(create).not.toHaveBeenCalled();
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'connection-1', identityId: 'identity-1' },
      data: expect.not.objectContaining({ identityId: expect.anything() }),
    });
    expect(updateMany.mock.calls[0][0].data).not.toHaveProperty('identityId');
  });

  it('refuses save when identityId would be reassigned', async () => {
    const findUnique = vi.fn(async () => ({ identityId: 'identity-1' }));
    const create = vi.fn();
    const updateMany = vi.fn();
    const repository = new KnowledgeRepositoryConnectionPrismaRepository({
      knowledgeRepositoryConnection: { findUnique, create, updateMany },
    } as unknown as PrismaClient);

    await expect(
      repository.save({
        id: 'connection-1',
        identityId: 'identity-other',
        githubUserId: 'github-user-1',
        githubRepositoryId: 'repository-1',
        githubRepositoryFullName: 'acme/notes',
        installationId: 'installation-1',
        defaultBranch: 'main',
        status: 'Active',
        lastSyncedCommitSha: null,
        lastProjectedCommitSha: null,
        lastErrorCode: null,
        lastErrorMessage: null,
        version: 1,
        createdAt: 1_750_000_000_000 as never,
        updatedAt: 1_750_000_000_000 as never,
        deletedAt: null,
      }),
    ).rejects.toThrow(/current identity/);
    expect(create).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

});
