import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@dailyuse/database';
import { RepositoryKnowledgeCloudDataPurgerAdapter } from './repository-knowledge-cloud-data-purger.adapter';

describe('RepositoryKnowledgeCloudDataPurgerAdapter', () => {
  it('revalidates ownership and deletes the AI index before the cascading connection row', async () => {
    const tx = {
      knowledgeRepositoryConnection: {
        findFirst: vi.fn(async () => ({ id: 'connection-1' })),
        delete: vi.fn(async () => undefined),
      },
      aiKnowledgeIndexEntry: {
        deleteMany: vi.fn(async () => ({ count: 2 })),
      },
    };
    const db = {
      $transaction: vi.fn(async (callback: (value: typeof tx) => Promise<boolean>) => callback(tx)),
    } as unknown as PrismaClient;
    const adapter = new RepositoryKnowledgeCloudDataPurgerAdapter(db);

    await expect(adapter.purge('identity-1', 'connection-1')).resolves.toBe(true);
    expect(tx.knowledgeRepositoryConnection.findFirst).toHaveBeenCalledWith({
      where: { id: 'connection-1', identityId: 'identity-1', deletedAt: null },
      select: { id: true },
    });
    expect(tx.aiKnowledgeIndexEntry.deleteMany).toHaveBeenCalledWith({
      where: { identityId: 'identity-1', repositoryId: 'connection-1' },
    });
    expect(tx.knowledgeRepositoryConnection.delete).toHaveBeenCalledWith({
      where: { id: 'connection-1' },
    });
    expect(tx.aiKnowledgeIndexEntry.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
      tx.knowledgeRepositoryConnection.delete.mock.invocationCallOrder[0],
    );
  });

  it('does not mutate either table when the identity-scoped connection is absent', async () => {
    const tx = {
      knowledgeRepositoryConnection: {
        findFirst: vi.fn(async () => null),
        delete: vi.fn(),
      },
      aiKnowledgeIndexEntry: { deleteMany: vi.fn() },
    };
    const db = {
      $transaction: vi.fn(async (callback: (value: typeof tx) => Promise<boolean>) => callback(tx)),
    } as unknown as PrismaClient;

    await expect(
      new RepositoryKnowledgeCloudDataPurgerAdapter(db).purge('identity-2', 'connection-1'),
    ).resolves.toBe(false);
    expect(tx.aiKnowledgeIndexEntry.deleteMany).not.toHaveBeenCalled();
    expect(tx.knowledgeRepositoryConnection.delete).not.toHaveBeenCalled();
  });
});
