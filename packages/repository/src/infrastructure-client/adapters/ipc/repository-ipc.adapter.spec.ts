import { describe, expect, it, vi } from 'vitest';
import { ok } from '@dailyuse/contracts/result';
import type { IResultIpcClient } from '../types';
import { RepositoryIpcAdapter } from './repository-ipc.adapter';

function createIpcClient() {
  return {
    invoke: vi.fn(async () => ok({})),
  } as unknown as IResultIpcClient;
}

describe('RepositoryIpcAdapter legacy database repository surface', () => {
  it('hard-fails removed Repository/Folder/Resource methods without invoking IPC', async () => {
    const ipcClient = createIpcClient();
    const adapter = new RepositoryIpcAdapter(ipcClient);

    await expect(adapter.getCurrentRepository()).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_SUPPORTED' },
    });
    await expect(adapter.listResources('repo-1')).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_SUPPORTED' },
    });
    await expect(adapter.createFolder({} as never)).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_SUPPORTED' },
    });
    await expect(adapter.uploadResources('repo-1', { files: [] } as never)).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_SUPPORTED' },
    });
    await expect(adapter.deleteBookmark('repo-1', 'bookmark-1')).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_SUPPORTED' },
    });

    expect(ipcClient.invoke).not.toHaveBeenCalled();
  });

  it('still routes knowledge connection methods over IPC', async () => {
    const ipcClient = createIpcClient();
    const adapter = new RepositoryIpcAdapter(ipcClient);
    await adapter.listKnowledgeRepositoryConnections();
    expect(ipcClient.invoke).toHaveBeenCalledWith('repository:knowledge-connection:list');
  });
});
