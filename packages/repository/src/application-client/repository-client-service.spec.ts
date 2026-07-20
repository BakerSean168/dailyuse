import { describe, expect, it, vi } from 'vitest';
import { ok } from '@dailyuse/contracts/result';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import type { IRepositoryApiClient } from './ports/repository-api-client.port';
import { RepositoryClientService } from './repository-client-service';

function createRepositoryDto(overrides: Partial<RepositoryClientDTO> = {}): RepositoryClientDTO {
  return {
    id: 'IRepositoryId_11111111-1111-4111-8111-111111111111' as RepositoryClientDTO['id'],
    identityId:
      'IdentityId_11111111-1111-4111-8111-111111111111' as RepositoryClientDTO['identityId'],
    name: 'Knowledge Base',
    type: 'Markdown',
    path: 'knowledge-base',
    description: null,
    config: {
      searchEngine: 'postgres',
      enableGit: false,
      autoSync: false,
      syncInterval: null,
    },
    stats: {
      folderCount: 0,
      resourceCount: 0,
      totalSize: 0,
      formattedSize: '0 B',
    },
    status: 'Active',
    version: 1,
    createdAt: 1742438400000,
    updatedAt: 1742438400000,
    deletedAt: null,
    isDeleted: false,
    isArchived: false,
    isActive: true,
    statusText: 'Active',
    typeText: 'Markdown',
    folderCount: 0,
    resourceCount: 0,
    totalSize: 0,
    formattedSize: '0 B',
    createdAtText: 'today',
    updatedAtText: 'today',
    ...overrides,
  };
}

function createApiClient(overrides: Partial<IRepositoryApiClient> = {}): IRepositoryApiClient {
  return {
    getCurrentRepository: vi.fn().mockResolvedValue(ok(null)),
    createFolder: vi.fn(),
    getFolderContents: vi.fn(),
    renameFolder: vi.fn(),
    moveFolder: vi.fn(),
    deleteFolder: vi.fn(),
    getFileTree: vi.fn(),
    search: vi.fn(),
    listResources: vi.fn(),
    createResource: vi.fn(),
    getResource: vi.fn(),
    updateResource: vi.fn(),
    renameResource: vi.fn(),
    moveResource: vi.fn(),
    deleteResource: vi.fn(),
    uploadResources: vi.fn(),
    listBookmarks: vi.fn(),
    createBookmark: vi.fn(),
    updateBookmark: vi.fn(),
    reorderBookmarks: vi.fn(),
    deleteBookmark: vi.fn(),
    startKnowledgeRepositoryInstallation: vi.fn(),
    completeKnowledgeRepositoryInstallation: vi.fn(),
    listKnowledgeRepositoryConnections: vi.fn(),
    connectKnowledgeRepository: vi.fn(),
    disconnectKnowledgeRepository: vi.fn(),
    previewKnowledgeRepositoryReconciliation: vi.fn(),
    executeKnowledgeRepositoryReconciliation: vi.fn(),
    syncKnowledgeRepository: vi.fn(),
    issueDesktopKnowledgeRepositoryToken: vi.fn(),
    listKnowledgeNoteProjections: vi.fn(),
    getKnowledgeNoteProjection: vi.fn(),
    getKnowledgeNoteLinkGraph: vi.fn(),
    createConfirmedKnowledgeNote: vi.fn(),
    getLocalVaultBinding: vi.fn(),
    selectLocalVault: vi.fn(),
    detachLocalVault: vi.fn(),
    scanLocalVault: vi.fn(),
    readLocalVaultNote: vi.fn(),
    searchLocalVault: vi.fn(),
    openLocalVaultInObsidian: vi.fn(),
    writeConfirmedLocalVaultNote: vi.fn(),
    ...overrides,
  } as IRepositoryApiClient;
}

describe('RepositoryClientService', () => {
  it('returns INVALID_RESPONSE when current repository DTO misses identityId', async () => {
    const api = createApiClient({
      getCurrentRepository: vi.fn().mockResolvedValue(
        ok(
          createRepositoryDto({
            identityId: undefined as unknown as RepositoryClientDTO['identityId'],
          }),
        ),
      ),
    });
    const service = new RepositoryClientService(api);

    const result = await service.getCurrentRepository();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_RESPONSE');
      expect(result.error.message).toContain('identityId');
    }
  });

  it('keeps methods bound when destructured from the service instance', async () => {
    const api = createApiClient({
      getCurrentRepository: vi.fn().mockResolvedValue(ok(createRepositoryDto())),
    });
    const service = new RepositoryClientService(api);
    const { getCurrentRepository } = service;

    const result = await getCurrentRepository();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data?.identityId).toBe('IdentityId_11111111-1111-4111-8111-111111111111');
    }
  });

  it('forwards Desktop knowledge repository synchronization requests', async () => {
    const syncKnowledgeRepository = vi.fn(async () =>
      ok({
        connection: {} as never,
        outcome: 'UpToDate' as const,
        headSha: 'a'.repeat(40),
        localCommitCreated: false,
        remoteChangesApplied: false,
        pushed: false,
      }),
    );
    const service = new RepositoryClientService(createApiClient({ syncKnowledgeRepository }));

    await service.syncKnowledgeRepository({ connectionId: 'connection-1' });

    expect(syncKnowledgeRepository).toHaveBeenCalledWith({ connectionId: 'connection-1' });
  });

  it('forwards GitHub projection queries and confirmed note creation', async () => {
    const listKnowledgeNoteProjections = vi.fn(async () => ok({ notes: [] }));
    const getKnowledgeNoteProjection = vi.fn();
    const getKnowledgeNoteLinkGraph = vi.fn(async () =>
      ok({
        centerProjectionId: 'projection-1',
        depth: 2,
        nodes: [],
        edges: [],
        unresolvedLinks: [],
        truncated: false,
      }),
    );
    const createConfirmedKnowledgeNote = vi.fn(async () =>
      ok({
        requestId: 'request-1',
        relativePath: 'notes/Approved.md',
        commitSha: 'commit-1',
        status: 'Committed' as const,
      }),
    );
    const service = new RepositoryClientService(
      createApiClient({
        listKnowledgeNoteProjections,
        getKnowledgeNoteProjection,
        getKnowledgeNoteLinkGraph,
        createConfirmedKnowledgeNote,
      }),
    );

    await service.listKnowledgeNoteProjections({
      connectionId: 'connection-1',
      query: 'approved',
      limit: 20,
    });
    await service.getKnowledgeNoteLinkGraph('projection-1', { depth: 2, maxNodes: 30 });
    await service.createConfirmedKnowledgeNote({
      connectionId: 'connection-1',
      proposalId: 'proposal-1',
      revision: 1,
      requestId: 'request-1',
      proposedPath: 'notes/Approved.md',
      title: 'Approved',
      frontmatter: {},
      content: '# Approved',
      reason: 'Reviewed by the user',
    });

    expect(listKnowledgeNoteProjections).toHaveBeenCalledWith({
      connectionId: 'connection-1',
      query: 'approved',
      limit: 20,
    });
    expect(getKnowledgeNoteLinkGraph).toHaveBeenCalledWith('projection-1', {
      depth: 2,
      maxNodes: 30,
    });
    expect(createConfirmedKnowledgeNote).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'request-1', proposedPath: 'notes/Approved.md' }),
    );
  });
});
