import { describe, expect, it } from 'vitest';
import type { ResourceClientDTO, SearchRequest } from '@dailyuse/contracts/repository';
import {
  buildHighlightSegments,
  buildIndexedHighlightSegments,
  searchRepositoryResources,
} from './repositorySearch';

function createResource(overrides: Partial<ResourceClientDTO> = {}): ResourceClientDTO {
  return {
    id: 'resource-1' as ResourceClientDTO['id'],
    repositoryId: 'repo-1' as ResourceClientDTO['repositoryId'],
    folderId: null,
    name: 'Unsafe [note].md',
    type: 'File',
    mimeType: 'text/markdown',
    path: '/notes/unsafe-note.md',
    size: 32,
    content: 'Heading\n<em>unsafe</em> [query]\nfoo(bar)',
    metadata: { tags: ['tag[1]'], wordCount: null, readingTime: null, thumbnail: null },
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
    displayName: 'Unsafe [note]',
    formattedSize: '32 B',
    createdAtText: 'today',
    updatedAtText: 'today',
    extension: '.md',
    icon: 'file',
    ...overrides,
  };
}

describe('repositorySearch', () => {
  it('escapes special characters for plain-text highlighting', () => {
    const segments = buildHighlightSegments('foo(bar) baz', 'foo(bar)', { useRegex: false });

    expect(segments).toEqual([
      { text: 'foo(bar)', match: true },
      { text: ' baz', match: false },
    ]);
  });

  it('keeps HTML-looking content as plain text segments', () => {
    const segments = buildHighlightSegments('<script>alert(1)</script>', 'alert(1)', {
      useRegex: false,
    });

    expect(segments[0]?.text).toBe('<script>');
    expect(segments[1]).toEqual({ text: 'alert(1)', match: true });
    expect(segments[2]?.text).toBe('</script>');
  });

  it('highlights indexed line matches safely', () => {
    const segments = buildIndexedHighlightSegments('abc<unsafe>xyz', 3, 11);

    expect(segments).toEqual([
      { text: 'abc', match: false },
      { text: '<unsafe>', match: true },
      { text: 'xyz', match: false },
    ]);
  });

  it('searches repository resources with real content matches', () => {
    const request: SearchRequest = {
      repositoryId: 'repo-1' as SearchRequest['repositoryId'],
      query: 'foo(bar)',
      mode: 'all',
      useRegex: false,
      caseSensitive: false,
    };

    const response = searchRepositoryResources([createResource()], request);

    expect(response.totalResults).toBe(1);
    expect(response.totalMatches).toBeGreaterThan(0);
    expect(response.results[0]?.matches[0]?.lineContent).toContain('foo(bar)');
  });
});
