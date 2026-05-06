import { beforeEach, describe, expect, it } from 'vitest';
import type {
  RepositoryClientDTO,
  ResourceBookmarkClientDTO,
  ResourceClientDTO,
  TreeNode,
} from '@dailyuse/contracts/repository';
import { createTestPinia } from '@dailyuse/test-utils';
import { __test__, useRepositoryStore } from './repositoryStore';

function createRepository(
  overrides: Partial<RepositoryClientDTO> = {},
): RepositoryClientDTO {
  return {
    id: 'repository-1' as RepositoryClientDTO['id'],
    name: 'Thought Forest',
    ...overrides,
  } as RepositoryClientDTO;
}

function createResource(
  overrides: Partial<ResourceClientDTO> = {},
): ResourceClientDTO {
  return {
    id: 'resource-1' as ResourceClientDTO['id'],
    repositoryId: 'repository-1' as ResourceClientDTO['repositoryId'],
    folderId: null,
    name: 'note.md',
    type: 'File',
    mimeType: 'text/markdown',
    path: '/note.md',
    size: 0,
    content: null,
    metadata: { tags: [], wordCount: null, readingTime: null, thumbnail: null },
    stats: { viewCount: 0, editCount: 0, linkCount: 0, lastViewedAt: null, lastEditedAt: null },
    status: 'Active',
    createdAt: 1741910400000,
    updatedAt: 1741910400000,
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
    displayName: 'note.md',
    aliasName: null,
    icon: null,
    color: null,
    sortOrder: 0,
    version: 1,
    createdAt: 1741910400000,
    updatedAt: 1741910400000,
    deletedAt: null,
    isOwner: true,
    ...overrides,
  };
}

describe('useRepositoryStore', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('groups resources by type and clears repository-scoped state on repository switch', () => {
    const store = useRepositoryStore();
    store.setCurrentRepository(createRepository());
    store.setResources([
      createResource(),
      createResource({
        id: 'resource-2' as ResourceClientDTO['id'],
        mimeType: 'image/png',
        extension: '.png',
      }),
      createResource({
        id: 'resource-3' as ResourceClientDTO['id'],
        mimeType: 'application/pdf',
        extension: '.pdf',
      }),
    ]);
    store.setTreeNodes([{ id: 'node-1' } as TreeNode]);
    store.setPersistedBookmarks([createBookmark()]);

    expect(store.repositoryId).toBe('repository-1');
    expect(store.resourcesByType.notes).toHaveLength(1);
    expect(store.resourcesByType.images).toHaveLength(1);
    expect(store.resourcesByType.files).toHaveLength(1);

    store.setCurrentRepository(createRepository({ id: 'repository-2' as RepositoryClientDTO['id'] }));

    expect(store.currentRepositoryId).toBe('repository-2');
    expect(store.resources).toEqual([]);
    expect(store.treeNodes).toEqual([]);
    expect(store.persistedBookmarks).toEqual([]);
  });

  it('applies bookmark alias, ordering, removal, upsert, and reset state', () => {
    const store = useRepositoryStore();
    const firstBookmark = createBookmark();
    const secondBookmark = createBookmark({
      id: 'bookmark-2' as ResourceBookmarkClientDTO['id'],
      resourceId: 'resource-2' as ResourceBookmarkClientDTO['resourceId'],
      displayName: 'photo.png',
    });

    store.setResources([
      createResource(),
      createResource({
        id: 'resource-2' as ResourceClientDTO['id'],
        name: 'photo.png',
        mimeType: 'image/png',
        extension: '.png',
      }),
    ]);
    store.setPersistedBookmarks([firstBookmark, secondBookmark]);
    store.setTransientBookmarkAlias(firstBookmark.id, 'Pinned Note');
    store.setTransientBookmarkOrder([secondBookmark.id, firstBookmark.id]);
    store.markTransientBookmarkRemoved(secondBookmark.id);
    store.upsertPersistedBookmark(createBookmark({ id: firstBookmark.id, displayName: 'Updated' }));
    store.setLoading(true);
    store.setError('boom');
    store.setInitialized(true);

    expect(store.bookmarks).toHaveLength(1);
    expect(store.bookmarks[0]?.displayName).toBe('Pinned Note');
    expect(store.isLoading).toBe(true);
    expect(store.error).toBe('boom');
    expect(store.isInitialized).toBe(true);

    store.clearTransientBookmarkAlias(firstBookmark.id);
    store.unmarkTransientBookmarkRemoved(secondBookmark.id);
    store.removePersistedBookmark(firstBookmark.id);
    store.resetBookmarkUiState();

    expect(store.bookmarks.map((bookmark) => bookmark.id)).toEqual([secondBookmark.id]);

    store.reset();
    expect(store.currentRepository).toBeNull();
    expect(store.currentRepositoryId).toBeNull();
    expect(store.resources).toEqual([]);
    expect(store.bookmarkUiState.orderedIds).toBeNull();
  });

  it('exposes bookmark helper functions for alias and ordering edge cases', () => {
    const resources = [createResource()];
    const bookmarks = [createBookmark()];

    const aliased = __test__.buildBookmarkWithAlias(bookmarks[0], 'Alias', resources);
    const ordered = __test__.applyBookmarkUiState(bookmarks, resources, {
      aliasById: { [bookmarks[0].id]: 'Alias' },
      orderedIds: [bookmarks[0].id, 'missing'],
      removedIds: [],
    });

    expect(aliased.displayName).toBe('Alias');
    expect(ordered[0]?.displayName).toBe('Alias');
  });
});
