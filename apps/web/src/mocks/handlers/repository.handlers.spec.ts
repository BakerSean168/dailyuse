import {
  createMockRepositorySearchResponse,
  createMockResourceBookmark,
  createMockUploadResourcesResponse,
  repositoryMockRoutes,
} from './repository.handlers';

describe('repository handlers contracts', () => {
  it('uses the current repository adapter route prefixes', () => {
    expect(repositoryMockRoutes.repositories).toMatch(/\/repositories$/);
    expect(repositoryMockRoutes.folders).toMatch(/\/folders$/);
    expect(repositoryMockRoutes.resources).toMatch(/\/resources$/);
    expect(repositoryMockRoutes.search).toMatch(/\/search$/);
  });

  it('builds bookmark, upload, and search payloads with current shapes', () => {
    expect(createMockResourceBookmark()).toEqual(
      expect.objectContaining({
        resourceId: expect.any(String),
        displayName: expect.any(String),
        isOwner: true,
      }),
    );

    expect(createMockUploadResourcesResponse('repo-1', ['A.md', 'B.md'])).toEqual(
      expect.objectContaining({
        successes: expect.arrayContaining([
          expect.objectContaining({ fileName: 'A.md', resource: expect.any(Object) }),
        ]),
        failures: [],
        resources: expect.arrayContaining([expect.objectContaining({ name: 'A.md' })]),
      }),
    );

    expect(createMockRepositorySearchResponse('roadmap')).toEqual(
      expect.objectContaining({
        query: 'roadmap',
        mode: 'all',
        results: expect.arrayContaining([
          expect.objectContaining({
            resourceId: expect.any(String),
            resourceName: expect.any(String),
            matchType: 'content',
          }),
        ]),
      }),
    );
  });
});
