import { describe, expect, it } from 'vitest';
import { repositoryMockRoutes } from './repository.handlers';
import { createHttpClientSpy } from './_shared/contract-test-helpers';

describe('repository handlers contracts', () => {
  it('exposes only knowledge repository route prefixes', () => {
    expect(repositoryMockRoutes.repositories).toMatch(/\/repositories$/);
    expect(repositoryMockRoutes.knowledgeConnections).toMatch(
      /\/repositories\/knowledge-connections$/,
    );
    expect(repositoryMockRoutes.knowledgeNotes).toMatch(/\/repositories\/knowledge-notes$/);
    expect(repositoryMockRoutes.knowledgeAttachments).toMatch(
      /\/repositories\/knowledge-attachments$/,
    );
    expect(repositoryMockRoutes).not.toHaveProperty('current');
    expect(repositoryMockRoutes).not.toHaveProperty('folders');
    expect(repositoryMockRoutes).not.toHaveProperty('resources');
    expect(repositoryMockRoutes).not.toHaveProperty('search');
  });

  it('hard-fails legacy adapter methods without issuing HTTP calls', async () => {
    const { RepositoryHttpAdapter } = await import('@dailyuse/repository/client');
    const httpClient = createHttpClientSpy();
    const adapter = new RepositoryHttpAdapter(httpClient);

    await expect(adapter.getCurrentRepository()).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_SUPPORTED' },
    });
    await expect(adapter.listResources('repo-1')).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_SUPPORTED' },
    });
    await expect(adapter.listBookmarks('repo-1')).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_SUPPORTED' },
    });
    await expect(
      adapter.uploadResources('repo-1', {
        files: [
          {
            name: 'Inbox.md',
            mimeType: 'text/markdown',
            contentBase64: 'IyA=',
          },
        ],
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_SUPPORTED' },
    });

    expect(httpClient.get).not.toHaveBeenCalled();
    expect(httpClient.post).not.toHaveBeenCalled();
    expect(httpClient.request).not.toHaveBeenCalled();
  });

  it('uses knowledge connection and projection routes for the live surface', async () => {
    const { RepositoryHttpAdapter } = await import('@dailyuse/repository/client');
    const httpClient = createHttpClientSpy();
    const adapter = new RepositoryHttpAdapter(httpClient);

    httpClient.get.mockResolvedValueOnce({ ok: true, data: { connections: [] } });
    httpClient.get.mockResolvedValueOnce({ ok: true, data: { notes: [] } });
    httpClient.get.mockResolvedValueOnce({ ok: true, data: { attachments: [] } });

    await adapter.listKnowledgeRepositoryConnections();
    await adapter.listKnowledgeNoteProjections({ limit: 20 });
    await adapter.listKnowledgeAttachmentProjections({ limit: 20 });

    expect(httpClient.get).toHaveBeenNthCalledWith(1, '/repositories/knowledge-connections');
    expect(httpClient.get).toHaveBeenNthCalledWith(2, '/repositories/knowledge-notes', {
      params: { limit: 20 },
    });
    expect(httpClient.get).toHaveBeenNthCalledWith(3, '/repositories/knowledge-attachments', {
      params: { limit: 20 },
    });
  });
});
