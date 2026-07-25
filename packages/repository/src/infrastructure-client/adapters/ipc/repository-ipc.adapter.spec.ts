import { describe, expect, it, vi } from 'vitest';
import { ok } from '@dailyuse/contracts/result';
import type { IResultIpcClient } from '../types';
import { RepositoryIpcAdapter } from './repository-ipc.adapter';

function createResultIpcClientStub() {
  return {
    invoke: vi.fn(async () => ok({})),
  } as unknown as IResultIpcClient;
}

describe('RepositoryIpcAdapter knowledge repository connections', () => {

  it('still routes knowledge connection methods over IPC', async () => {
    const ipcClient = createResultIpcClientStub();
    const adapter = new RepositoryIpcAdapter(ipcClient);
    await adapter.listKnowledgeRepositoryConnections();
    expect(ipcClient.invoke).toHaveBeenCalledWith('repository:knowledge-connection:list');
  });
});
