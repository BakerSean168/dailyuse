import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthChannels } from '@dailyuse/contracts/electron';
import { executeDesktopAuthenticatedResult } from './execute-desktop-authenticated-result';

describe('executeDesktopAuthenticatedResult', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('recovers desktop auth and retries the operation once', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({ authenticated: false, runtimeState: 'RESTORING' })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ authenticated: true });

    const operation = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false as const,
        error: { code: 'AUTH_REQUIRED', message: 'Auth required' },
      })
      .mockResolvedValueOnce({
        ok: true as const,
        data: { id: 'success' },
      });
    const onSuccess = vi.fn();

    const result = await executeDesktopAuthenticatedResult({
      operation,
      logScope: 'ExecuteDesktopAuthenticatedResultSpec',
      desktopApi: { invoke },
      onSuccess,
    });

    expect(result).toEqual({
      ok: true,
      data: { id: 'success' },
    });
    expect(operation).toHaveBeenCalledTimes(2);
    expect(invoke).toHaveBeenNthCalledWith(1, AuthChannels.GET_STATUS);
    expect(invoke).toHaveBeenNthCalledWith(2, AuthChannels.INITIALIZE);
    expect(invoke).toHaveBeenNthCalledWith(3, AuthChannels.GET_STATUS);
    expect(onSuccess).toHaveBeenCalledWith({ id: 'success' });
  });

  it('does not retry non-auth failures and reports the translated error', async () => {
    const operation = vi.fn().mockResolvedValue({
      ok: false as const,
      error: { code: 'INTERNAL_ERROR', message: 'Boom' },
    });
    const onError = vi.fn();
    const onFinally = vi.fn();

    const result = await executeDesktopAuthenticatedResult({
      operation,
      logScope: 'ExecuteDesktopAuthenticatedResultSpec',
      t: (key: string) => `translated:${key}`,
      fallbackKey: 'common.operationFailed',
      onError,
      onFinally,
    });

    expect(result.ok).toBe(false);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      { code: 'INTERNAL_ERROR', message: 'Boom' },
      'translated:errors.INTERNAL_ERROR',
    );
    expect(onFinally).toHaveBeenCalledTimes(1);
  });
});
