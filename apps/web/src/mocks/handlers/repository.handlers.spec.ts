import {
  createMockRepositorySearchResponse,
  createMockResourceBookmark,
  createMockUploadResourcesResponse,
  repositoryMockRoutes,
} from './repository.handlers';
import {
  createHttpClientSpy,
  expectSchemaSuccess,
  successResult,
} from './_shared/contract-test-helpers';
import { describe, expect, it } from 'vitest';
import type { ResourceId } from '@dailyuse/contracts/primitives';
import { createMockRepository } from '@dailyuse/contracts/mocks';
import { RepositoryResponseSchema } from '@dailyuse/contracts/repository';
import { RepositoryHttpAdapter } from '@dailyuse/repository/infrastructure-client';

describe('repository handlers contracts', () => {
  it('uses the current repository adapter route prefixes', () => {
    expect(repositoryMockRoutes.repositories).toMatch(/\/repositories$/);
    expect(repositoryMockRoutes.current).toMatch(/\/repositories\/current$/);
    expect(repositoryMockRoutes.folders).toMatch(/\/folders$/);
    expect(repositoryMockRoutes.resources).toMatch(/\/resources$/);
    expect(repositoryMockRoutes.search).toMatch(/\/search$/);
  });

  it('uses the explicit current repository route and response shape as the adapter', async () => {
    const httpClient = createHttpClientSpy();
    const adapter = new RepositoryHttpAdapter(httpClient);
    const repository = createMockRepository();

    httpClient.get.mockResolvedValueOnce(successResult(repository));

    const result = await adapter.getCurrentRepository();

    expect(httpClient.get).toHaveBeenCalledWith('/repositories/current');
    expect(result).toEqual({ ok: true, data: repository });
    if (result.ok) {
      expectSchemaSuccess(RepositoryResponseSchema, result.data);
    }
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

  it('uses the same nested resource list route and array response shape as the adapter', async () => {
    const httpClient = createHttpClientSpy();
    const adapter = new RepositoryHttpAdapter(httpClient);
    const mockResources = [{ id: 'resource-1', name: 'Inbox.md' }];

    httpClient.get.mockResolvedValueOnce({ ok: true, data: mockResources });

    const result = await adapter.listResources('repo-1');

    expect(httpClient.get).toHaveBeenCalledWith('/repositories/repo-1/resources');
    expect(result).toEqual({ ok: true, data: mockResources });
    if (result.ok) {
      expect(repositoryMockRoutes.repositories).toMatch(/\/repositories$/);
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  it('uses the current bookmark routes and payload shapes as the adapter', async () => {
    const httpClient = createHttpClientSpy();
    const adapter = new RepositoryHttpAdapter(httpClient);
    const mockBookmarks = [
      createMockResourceBookmark({ id: 'bookmark-1', resourceId: 'resource-1' as ResourceId }),
    ];

    httpClient.get.mockResolvedValueOnce({ ok: true, data: mockBookmarks });
    httpClient.post.mockResolvedValueOnce({ ok: true, data: mockBookmarks[0] });
    httpClient.patch.mockResolvedValueOnce({ ok: true, data: mockBookmarks[0] });
    httpClient.post.mockResolvedValueOnce({ ok: true, data: mockBookmarks });
    httpClient.delete.mockResolvedValueOnce({ ok: true, data: null });

    const listResult = await adapter.listBookmarks('repo-1');
    const createPayload = {
      resourceId: 'resource-1' as ResourceId,
      aliasName: 'Pinned',
      icon: 'star',
      color: '#ffaa00',
    };
    const updatePayload = {
      aliasName: 'Renamed',
      icon: 'pin',
      color: '#333333',
    };
    const reorderPayload = { bookmarkIds: ['bookmark-1', 'bookmark-2'] };

    await adapter.createBookmark('repo-1', createPayload);
    await adapter.updateBookmark('repo-1', 'bookmark-1', updatePayload);
    await adapter.reorderBookmarks('repo-1', reorderPayload);
    await adapter.deleteBookmark('repo-1', 'bookmark-1');

    expect(httpClient.get).toHaveBeenCalledWith('/repositories/repo-1/bookmarks');
    expect(httpClient.post).toHaveBeenNthCalledWith(
      1,
      '/repositories/repo-1/bookmarks',
      createPayload,
    );
    expect(httpClient.patch).toHaveBeenCalledWith(
      '/repositories/repo-1/bookmarks/bookmark-1',
      updatePayload,
    );
    expect(httpClient.post).toHaveBeenNthCalledWith(
      2,
      '/repositories/repo-1/bookmarks/reorder',
      reorderPayload,
    );
    expect(httpClient.delete).toHaveBeenCalledWith('/repositories/repo-1/bookmarks/bookmark-1');
    expect(listResult).toEqual({ ok: true, data: mockBookmarks });
    if (listResult.ok) {
      expect(Array.isArray(listResult.data)).toBe(true);
      expect(listResult.data[0]).toEqual(
        expect.objectContaining({
          resourceId: 'resource-1',
          displayName: expect.any(String),
          isOwner: true,
        }),
      );
    }
  });

  it('uses the current upload route and multipart shape as the adapter', async () => {
    const httpClient = createHttpClientSpy();
    const adapter = new RepositoryHttpAdapter(httpClient);
    const uploadResponse = createMockUploadResourcesResponse('repo-1', ['Inbox.md']);

    httpClient.request.mockResolvedValueOnce(successResult(uploadResponse));

    const result = await adapter.uploadResources('repo-1', {
      files: [
        {
          name: 'Inbox.md',
          mimeType: 'text/markdown',
          contentBase64: 'IyBIZWxsbyB3b3JsZA==',
        },
      ],
      folderId: 'folder-1',
      tags: ['inbox', 'draft'],
      overwritePolicy: 'replace',
    });

    expect(httpClient.request).toHaveBeenCalledTimes(1);
    const requestConfig = httpClient.request.mock.calls[0]?.[0] as {
      method: string;
      url: string;
      data: FormData;
      headers: Record<string, string>;
    };
    expect(requestConfig.method).toBe('post');
    expect(requestConfig.url).toBe('/repositories/repo-1/resources/upload');
    expect(requestConfig.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
    expect(requestConfig.data).toBeInstanceOf(FormData);
    expect(requestConfig.data.get('folderId')).toBe('folder-1');
    expect(requestConfig.data.get('tags')).toBe(JSON.stringify(['inbox', 'draft']));
    expect(requestConfig.data.get('overwritePolicy')).toBe('replace');
    expect(requestConfig.data.getAll('files')).toHaveLength(1);
    expect(result).toEqual({ ok: true, data: uploadResponse });
    expect(repositoryMockRoutes.repositories).toMatch(/\/repositories$/);
  });
});
