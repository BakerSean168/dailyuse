import { describe, expect, it, vi } from 'vitest';
import { ServerHeldDataDisclosureEnvelopeV1Schema } from '@dailyuse/contracts/data-portability';
import type { ServerHeldDataDisclosureSource } from '../../server-held-data-disclosure.source';
import { ExportServerHeldDataDisclosureUseCase } from '../export-server-held-data-disclosure.use-case';

describe('ExportServerHeldDataDisclosureUseCase', () => {
  it('builds a distinct non-importable disclosure with retained server records', async () => {
    const source: ServerHeldDataDisclosureSource = {
      readForIdentity: vi.fn().mockResolvedValue({
        knowledgeRepositoryConnections: [
          {
            id: 'connection-1',
            githubUserId: 'github-user-1',
            githubRepositoryId: 'github-repository-1',
            githubRepositoryFullName: 'owner/vault',
            githubInstallationId: 'installation-1',
            defaultBranch: 'main',
            isPrivate: true,
            status: 'REVOKED',
            lastSyncedCommitSha: 'commit-1',
            lastProjectedCommitSha: 'commit-1',
            lastErrorCode: null,
            lastErrorMessage: null,
            version: 2,
            createdAt: '2026-07-18T00:00:00.000Z',
            updatedAt: '2026-07-20T00:00:00.000Z',
            deletedAt: '2026-07-20T00:00:00.000Z',
          },
        ],
        githubWebhookDeliveries: [],
        knowledgeNoteProjections: [
          {
            id: 'projection-1',
            connectionId: 'connection-1',
            relativePath: 'notes/private.md',
            commitSha: 'commit-1',
            blobSha: 'blob-1',
            contentHash: 'hash-1',
            frontmatter: { tags: ['private'] },
            markdownContent: '# Private note',
            indexStatus: 'INDEXED',
            createdAt: '2026-07-18T00:00:00.000Z',
            updatedAt: '2026-07-18T00:00:00.000Z',
            deletedAt: null,
          },
        ],
        knowledgeAttachmentProjections: [],
        knowledgeAttachmentContentCaches: [
          {
            connectionId: 'connection-1',
            blobSha: 'attachment-blob-1',
            byteSize: 3,
            contentBase64: 'AQID',
            cachedAt: '2026-07-20T00:00:00.000Z',
            expiresAt: '2026-07-20T01:00:00.000Z',
          },
        ],
        knowledgeWriteRequests: [],
        aiKnowledgeIndexEntries: [],
      }),
    };
    const useCase = new ExportServerHeldDataDisclosureUseCase(
      source,
      () => new Date('2026-07-20T12:34:56.000Z'),
    );

    const result = await useCase.execute('identity-1');
    const envelope = JSON.parse(result.content) as unknown;

    expect(source.readForIdentity).toHaveBeenCalledWith('identity-1');
    expect(result.fileName).toBe(
      'memoflow-server-held-data-disclosure-v1-2026-07-20T12-34-56.json',
    );
    expect(result.summary.entityCounts).toMatchObject({
      knowledgeRepositoryConnections: 1,
      knowledgeNoteProjections: 1,
      knowledgeAttachmentContentCaches: 1,
    });
    expect(result.summary.cachedAttachmentBytes).toBe(3);
    expect(ServerHeldDataDisclosureEnvelopeV1Schema.safeParse(envelope).success).toBe(true);
    expect(envelope).toMatchObject({
      kind: 'memoflow.server-held-data-disclosure',
      subject: { identityId: 'identity-1' },
      scope: {
        importMode: 'not-importable',
        includesApplicationManagedReplayableGithubAuthorization: false,
        includesLocalVaultFiles: false,
        includesEphemeralWorkerLeases: false,
      },
      data: {
        knowledgeNoteProjections: [{ markdownContent: '# Private note' }],
        knowledgeAttachmentContentCaches: [{ contentBase64: 'AQID' }],
      },
    });
  });
});
