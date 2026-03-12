import { describe, expect, it } from 'vitest';
import { fail } from './index';
import { fromHttpResponse, toHttpResponse } from './http';
import { fromIpcResult, toIpcResult } from './ipc';

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
});
