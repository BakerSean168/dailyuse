import { describe, expect, it } from 'vitest';
import { fail, ResultErrorException } from './index';
import { fromHttpResponse, toHttpResponse } from './http';
import { createIpcClientWrapper, fromIpcResult, toIpcResult } from './ipc';

describe('result transport context support', () => {
  it('preserves error context through HTTP conversion', () => {
    const result = fail({
      code: 'CONFLICT',
      message: 'Multiple repositories found',
      context: {
        count: 2,
        repositoryIds: ['repo-1', 'repo-2'],
      },
    });

    const http = toHttpResponse(result);
    const restored = fromHttpResponse(http);

    expect(http.error?.context).toEqual({
      count: 2,
      repositoryIds: ['repo-1', 'repo-2'],
    });
    expect(restored.ok).toBe(false);
    if (!restored.ok) {
      expect(restored.error.context).toEqual({
        count: 2,
        repositoryIds: ['repo-1', 'repo-2'],
      });
    }
  });

  it('preserves error context through IPC conversion', () => {
    const result = fail({
      code: 'CONFLICT',
      message: 'Multiple repositories found',
      context: {
        count: 2,
        repositoryIds: ['repo-1', 'repo-2'],
      },
    });

    const ipc = toIpcResult(result);
    const restored = fromIpcResult(ipc);

    expect(ipc.error?.context).toEqual({
      count: 2,
      repositoryIds: ['repo-1', 'repo-2'],
    });
    expect(restored.ok).toBe(false);
    if (!restored.ok) {
      expect(restored.error.context).toEqual({
        count: 2,
        repositoryIds: ['repo-1', 'repo-2'],
      });
    }
  });

  it('throws ResultErrorException from invokeUnsafe', async () => {
    const client = createIpcClientWrapper({
      invoke: async () =>
        toIpcResult(
          fail({
            code: 'UNAUTHORIZED',
            message: '未授权，请登录',
          }),
        ),
    });

    await expect(client.invokeUnsafe('auth:status')).rejects.toMatchObject<ResultErrorException>({
      name: 'ResultErrorException',
      code: 'UNAUTHORIZED',
      message: '未授权，请登录',
    });
  });
});
