import { describe, expect, it, vi } from 'vitest';
import type { ResourceBookmarkClientDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';
import { __test__ as composableTest } from './useRepository';
import { __test__ as storeTest } from '../stores/repositoryStore';

function createResource(overrides: Partial<ResourceClientDTO> = {}): ResourceClientDTO {
  return {
    id: 'resource-1' as ResourceClientDTO['id'],
    repositoryId: 'repo-1' as ResourceClientDTO['repositoryId'],
    folderId: null,
    name: 'Original Name.md',
    type: 'File',
    mimeType: 'text/markdown',
    path: '/Original Name.md',
    size: 10,
    content: '# Hello',
    metadata: { tags: [], wordCount: null, readingTime: null, thumbnail: null },
    stats: { viewCount: 0, editCount: 0, linkCount: 0, lastViewedAt: null, lastEditedAt: null },
    status: 'Active',
    createdAt: 1741564800000,
    updatedAt: 1741564800000,
    deletedAt: null,
    version: 1,
    isDeleted: false,
    isArchived: false,
    isActive: true,
    isDraft: false,
    extension: '.md',
    icon: 'file',
    ...overrides,
  };
}

function createBookmark(
  overrides: Partial<ResourceBookmarkClientDTO> = {},
): ResourceBookmarkClientDTO {
  return {
    id: 'bookmark-1' as ResourceBookmarkClientDTO['id'],
    resourceId: 'resource-1' as ResourceBookmarkClientDTO['resourceId'],
    identityId: 'identity-1' as ResourceBookmarkClientDTO['identityId'],
    aliasName: null,
    displayName: 'Original Name',
    icon: 'mdi-file-document-outline',
    color: null,
    sortOrder: 0,
    version: 1,
    createdAt: 1741564800000,
    updatedAt: 1741564800000,
    deletedAt: null,
    isOwner: true,
    ...overrides,
  };
}

describe('useRepository helpers', () => {
  it('maps upload response payloads into UI result shape', () => {
    const response = {
      successes: [{ resource: createResource() }],
      failures: [{ fileName: 'broken.pdf', message: 'Nope', code: 'UPLOAD_FAILED' }],
    };

    expect(composableTest.isUploadResponse(response)).toBe(true);
  });

  it('rebuilds bookmark display name from linked resource when alias is cleared', () => {
    const resource = createResource({ name: 'Recovered Title.md' });
    const bookmark = createBookmark({ aliasName: 'Old Alias', displayName: 'Old Alias' });

    const updated = storeTest.buildBookmarkWithAlias(bookmark, null, [resource]);

    expect(updated.aliasName).toBeNull();
    expect(updated.displayName).toBe('Recovered Title');
  });

  it('applies transient bookmark UI state without mutating persisted truth', () => {
    const first = createBookmark();
    const second = createBookmark({
      id: 'bookmark-2' as ResourceBookmarkClientDTO['id'],
      sortOrder: 1,
    });

    const derived = storeTest.applyBookmarkUiState(
      [first, second],
      [createResource({ id: 'resource-2' as ResourceClientDTO['id'] })],
      {
        aliasById: { [first.id]: 'Temporary Alias' },
        orderedIds: [second.id, first.id],
        removedIds: [second.id],
      },
    );

    expect(derived).toHaveLength(1);
    expect(derived[0]?.id).toBe(first.id);
    expect(derived[0]?.aliasName).toBe('Temporary Alias');
    expect(first.aliasName).toBeNull();
  });

  it('reorders bookmarks while preserving ids not included in payload tail', () => {
    const first = createBookmark();
    const second = createBookmark({ id: 'bookmark-2' as ResourceBookmarkClientDTO['id'] });
    const third = createBookmark({ id: 'bookmark-3' as ResourceBookmarkClientDTO['id'] });

    expect(
      composableTest
        .reorderBookmarkCollection([first, second, third], [third.id, first.id])
        .map((bookmark) => bookmark.id),
    ).toEqual([third.id, first.id, second.id]);
  });

  it('recovers desktop auth when repository request returns AUTH_REQUIRED', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({ authenticated: false, runtimeState: 'RESTORING' })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ authenticated: true });

    const result = await composableTest.executeAuthRecovery(
      () =>
        Promise.resolve({ ok: false as const, error: { code: 'AUTH_REQUIRED', message: 'nope' } }),
      { electronAPI: { invoke } },
    );

    expect(result).toBe(true);
    expect(invoke).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-auth repository errors', async () => {
    const invoke = vi.fn();

    const result = await composableTest.executeAuthRecovery(
      () =>
        Promise.resolve({
          ok: false as const,
          error: { code: 'INVALID_RESPONSE', message: 'bad dto' },
        }),
      { electronAPI: { invoke } },
    );

    expect(result).toBe(false);
    expect(invoke).not.toHaveBeenCalled();
  });
});
