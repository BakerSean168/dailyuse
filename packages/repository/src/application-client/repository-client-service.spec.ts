import { describe, expect, it, vi } from 'vitest';
import { ok } from '@dailyuse/contracts/result';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import type { IRepositoryApiClient } from '../infrastructure-client/adapters/types';
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
});
