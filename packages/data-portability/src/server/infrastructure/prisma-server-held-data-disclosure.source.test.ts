import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@dailyuse/database';
import { PrismaServerHeldDataDisclosureSource } from './prisma-server-held-data-disclosure.source';

describe('PrismaServerHeldDataDisclosureSource', () => {
  it('uses identity-scoped allowlisted reads and maps cached bytes without credentials', async () => {
    const timestamp = new Date('2026-07-20T00:00:00.000Z');
    const connectionFindMany = vi.fn().mockResolvedValue([
      {
        id: 'connection-1',
        githubUserId: 'github-user-1',
        githubRepositoryId: 'github-repository-1',
        githubRepositoryFullName: 'owner/vault',
        installationId: 'installation-1',
        defaultBranch: 'main',
        isPrivate: true,
        status: 'ACTIVE',
        lastSyncedCommitSha: null,
        lastProjectedCommitSha: null,
        lastErrorCode: null,
        lastErrorMessage: null,
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
        webhookDeliveries: [],
        noteProjections: [],
        attachmentProjections: [],
        attachmentContentCaches: [
          {
            connectionId: 'connection-1',
            blobSha: 'blob-1',
            byteSize: 3,
            contentBytes: Uint8Array.from([1, 2, 3]),
            cachedAt: timestamp,
            expiresAt: timestamp,
          },
        ],
        writeRequests: [],
      },
    ]);
    const indexFindMany = vi.fn().mockResolvedValue([
      {
        id: 'index-1',
        repositoryId: 'connection-1',
        resourceId: 'projection-1',
        resourcePath: 'note.md',
        title: 'Note',
        mimeType: 'text/markdown',
        contentHash: 'hash-1',
        status: 'INDEXED',
        summary: 'Summary',
        keywords: ['note'],
        embedding: [0.1, 0.2],
        chunks: [{ text: 'Note' }],
        metadata: { source: 'github-default-branch-projection' },
        error: null,
        indexedAt: timestamp,
        lastRequestedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
      },
    ]);
    const db = {
      knowledgeRepositoryConnection: { findMany: connectionFindMany },
      aiKnowledgeIndexEntry: { findMany: indexFindMany },
    } as unknown as PrismaClient;

    const source = new PrismaServerHeldDataDisclosureSource(db);
    const result = await source.readForIdentity('identity-1');

    expect(connectionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { identityId: 'identity-1' } }),
    );
    expect(indexFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { identityId: 'identity-1' } }),
    );
    const connectionQuery = connectionFindMany.mock.calls[0]?.[0];
    const indexQuery = indexFindMany.mock.calls[0]?.[0];
    expect(connectionQuery.select.installationId).toBe(true);
    expect(connectionQuery.select).not.toHaveProperty('accessToken');
    expect(connectionQuery.select).not.toHaveProperty('privateKey');
    expect(indexQuery.select).not.toHaveProperty('retrievalVector');
    expect(result.knowledgeRepositoryConnections[0]).toMatchObject({
      githubInstallationId: 'installation-1',
      createdAt: '2026-07-20T00:00:00.000Z',
    });
    expect(result.knowledgeAttachmentContentCaches[0]?.contentBase64).toBe('AQID');
    expect(result.aiKnowledgeIndexEntries[0]).toMatchObject({
      id: 'index-1',
      embedding: [0.1, 0.2],
    });
  });
});
