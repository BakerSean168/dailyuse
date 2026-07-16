import { describe, expect, it, vi } from 'vitest';
import type { ResourceBookmarkClientDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';
import { ok } from '@dailyuse/contracts/result';
import {
  buildInitialMarkdownContent,
  buildNoteNameFromTitle,
  ensureUniqueNoteName,
  isUploadResponse,
} from './repositoryHelpers';
import { __test__ as bookmarkTest } from './useRepositoryBookmarks';
import { __test__ as storeTest } from '../stores/repository-store';
import { recoverDesktopAuthIfNeeded } from '../../../shared/utils/desktop-auth-recovery';
import { useRepositoryResources } from './useRepositoryResources';

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
  it('derives a safe predictable filename and matching heading from a note title', () => {
    const name = buildNoteNameFromTitle('  Project / Retrospective.md  ');

    expect(name).toBe('Project - Retrospective.md');
    expect(buildInitialMarkdownContent(name)).toBe('# Project - Retrospective\n\n');
  });

  it('keeps note filenames unique without changing the base naming contract', () => {
    const resources = [
      createResource({ name: 'Project Retrospective.md' }),
      createResource({
        id: 'resource-2' as ResourceClientDTO['id'],
        name: 'Project Retrospective 2.md',
      }),
    ];

    expect(ensureUniqueNoteName('Project Retrospective.md', resources)).toBe(
      'Project Retrospective 3.md',
    );
  });

  it('creates a unique note with a heading that matches the persisted filename', async () => {
    const createResourceRequest = vi.fn(
      async (_repositoryId: string, request: Record<string, unknown>) =>
        ok(
          createResource({
            id: 'resource-created' as ResourceClientDTO['id'],
            name: String(request.name),
            content: String(request.content),
          }),
        ),
    );
    const resources = useRepositoryResources({
      service: {
        getCurrentRepository: vi.fn(),
        listResources: vi.fn(),
        createResource: createResourceRequest,
        updateResource: vi.fn(),
        deleteResource: vi.fn(),
      },
      executeOperation: (operation) => operation(),
      handleError: vi.fn(),
      getRepositoryId: () => 'repo-1',
      getResources: () => [createResource({ name: 'Project Retrospective.md' })],
      addResource: vi.fn(),
      updateResourceInStore: vi.fn(),
      removeResource: vi.fn(),
      refreshTree: vi.fn(async () => undefined),
    });

    const created = await resources.createMarkdownNote('Project Retrospective.md');

    expect(created?.name).toBe('Project Retrospective 2.md');
    expect(created?.content).toBe('# Project Retrospective 2\n\n');
    expect(createResourceRequest).toHaveBeenCalledWith(
      'repo-1',
      expect.objectContaining({
        name: 'Project Retrospective 2.md',
        content: '# Project Retrospective 2\n\n',
      }),
    );
  });

  it('maps upload response payloads into UI result shape', () => {
    const response = {
      successes: [{ resource: createResource() }],
      failures: [{ fileName: 'broken.pdf', message: 'Nope', code: 'UPLOAD_FAILED' }],
    };

    expect(isUploadResponse(response)).toBe(true);
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
      bookmarkTest
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

    const result = await recoverDesktopAuthIfNeeded(
      { code: 'AUTH_REQUIRED' },
      { invoke },
      'Repository',
    );

    expect(result).toBe(true);
    expect(invoke).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-auth repository errors', async () => {
    const invoke = vi.fn();

    const result = await recoverDesktopAuthIfNeeded(
      { code: 'INVALID_RESPONSE' },
      { invoke },
      'Repository',
    );

    expect(result).toBe(false);
    expect(invoke).not.toHaveBeenCalled();
  });
});
