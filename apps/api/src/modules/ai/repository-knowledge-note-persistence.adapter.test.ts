import { describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import type { RepositoryApplicationPort } from '@memoflow/repository';
import { RepositoryKnowledgeNotePersistenceAdapter } from './repository-knowledge-note-persistence.adapter';

function connection(id: string, status: 'Active' | 'Revoked' = 'Active') {
  return {
    id,
    identityId: 'identity-1' as never,
    githubUserId: '42',
    githubRepositoryId: `repo-${id}`,
    githubRepositoryFullName: `owner/${id}`,
    installationId: `installation-${id}`,
    defaultBranch: 'main',
    status,
    lastSyncedCommitSha: null,
    lastProjectedCommitSha: null,
    lastErrorCode: null,
    canSync: status === 'Active',
    createdAt: 1 as never,
    updatedAt: 1 as never,
  };
}

function createApi(connections: ReturnType<typeof connection>[]) {
  return {
    listKnowledgeRepositoryConnections: vi.fn(async () => ok({ connections })),
    createConfirmedKnowledgeNote: vi.fn(async () =>
      ok({
        requestId: 'request-1',
        relativePath: 'notes/Approved.md',
        commitSha: 'commit-1',
        status: 'Committed' as const,
      }),
    ),
  } as unknown as RepositoryApplicationPort;
}

const confirmedContext = {
  requestId: 'req-knp-test',
  traceId: 'req-knp-test',
  startedAt: 1_700_000_000_000,
  source: 'system',
  identityId: 'identity-1',
  deviceId: 'api-server',
};

const confirmedInput = {
  identityId: 'identity-1',
  context: confirmedContext,
  path: 'notes/Approved.md',
  fileName: 'Approved.md',
  content: '# Approved\n\nReviewed body',
  proposalId: 'proposal-1',
  proposalRevision: 2,
  requestId: 'request-1',
};

describe('RepositoryKnowledgeNotePersistenceAdapter', () => {
  it('requires immutable confirmation metadata before contacting GitHub', async () => {
    const api = createApi([connection('connection-1')]);
    const adapter = new RepositoryKnowledgeNotePersistenceAdapter(api);

    await expect(
      adapter.createKnowledgeNote({
        identityId: 'identity-1',
        path: 'notes/Draft.md',
        fileName: 'Draft.md',
        content: '# Draft',
      }),
    ).rejects.toThrow(/confirmed knowledge-note proposal/i);
    expect(api.listKnowledgeRepositoryConnections).not.toHaveBeenCalled();
  });

  it('commits through the selected single active connection and returns a projection view', async () => {
    const api = createApi([connection('connection-1'), connection('connection-old', 'Revoked')]);
    const adapter = new RepositoryKnowledgeNotePersistenceAdapter(api);

    const result = await adapter.createKnowledgeNote(confirmedInput);

    expect(api.listKnowledgeRepositoryConnections).toHaveBeenCalledWith(confirmedContext);
    expect(api.createConfirmedKnowledgeNote).toHaveBeenCalledWith(
      confirmedContext,
      expect.objectContaining({
        connectionId: 'connection-1',
        proposalId: 'proposal-1',
        revision: 2,
        requestId: 'request-1',
        proposedPath: 'notes/Approved.md',
        title: 'Approved',
        content: '# Approved\n\nReviewed body',
      }),
    );
    expect(result.note).toMatchObject({
      name: 'Approved.md',
      path: 'notes/Approved.md',
      content: '# Approved\n\nReviewed body',
      mimeType: 'text/markdown',
      repositoryScopeId: 'connection-1',
    });
  });

  it('does not silently choose a repository when multiple active connections exist', async () => {
    const api = createApi([connection('connection-1'), connection('connection-2')]);
    const adapter = new RepositoryKnowledgeNotePersistenceAdapter(api);

    await expect(adapter.createKnowledgeNote(confirmedInput)).rejects.toThrow(
      /explicit knowledge repository connection/i,
    );
    expect(api.createConfirmedKnowledgeNote).not.toHaveBeenCalled();
  });

  it('uses an explicit active connection when multiple repositories are available', async () => {
    const api = createApi([connection('connection-1'), connection('connection-2')]);
    const adapter = new RepositoryKnowledgeNotePersistenceAdapter(api);

    await adapter.createKnowledgeNote({ ...confirmedInput, connectionId: 'connection-2' });

    expect(api.createConfirmedKnowledgeNote).toHaveBeenCalledWith(
      confirmedContext,
      expect.objectContaining({ connectionId: 'connection-2' }),
    );
  });
});
