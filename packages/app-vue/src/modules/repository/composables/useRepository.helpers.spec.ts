import { describe, expect, it } from 'vitest';
import type { ResourceBookmarkClientDTO, ResourceClientDTO } from '@dailyuse/contracts/repository';
import { __test__ } from './useRepository';

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
    statusText: 'Active',
    typeText: 'File',
    displayName: 'Original Name',
    formattedSize: '10 B',
    createdAtText: 'today',
    updatedAtText: 'today',
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

    expect(__test__.isUploadResponse(response)).toBe(true);
  });

  it('rebuilds bookmark display name from linked resource when alias is cleared', () => {
    const resource = createResource({ displayName: 'Recovered Title' });
    const bookmark = createBookmark({ aliasName: 'Old Alias', displayName: 'Old Alias' });

    const updated = __test__.buildBookmarkWithAlias(bookmark, null, [resource]);

    expect(updated.aliasName).toBeNull();
    expect(updated.displayName).toBe('Recovered Title');
  });
});
