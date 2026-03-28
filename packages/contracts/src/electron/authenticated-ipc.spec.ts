import { describe, expect, it, vi } from 'vitest';
import type { IElectronModuleContext } from './index';
import { createAuthenticatedIpcWrapper } from './authenticated-ipc';
import { ElectronAuthResolutionError } from './auth-context';

function createContext(overrides?: {
  requireRequestContext?: () => Promise<{ identityId: string; deviceId: string }>;
}): IElectronModuleContext {
  return {
    db: {} as IElectronModuleContext['db'],
    auth: {
      requireRequestContext:
        overrides?.requireRequestContext ??
        vi.fn().mockResolvedValue({ identityId: 'IdentityId_test', deviceId: 'desktop-app' }),
    },
  } as IElectronModuleContext;
}

describe('createAuthenticatedIpcWrapper', () => {
  it('maps explicit auth resolution errors to auth result codes', async () => {
    const ctx = createContext({
      requireRequestContext: vi
        .fn()
        .mockRejectedValue(new ElectronAuthResolutionError('AUTH_REQUIRED')),
    });

    const withAuthenticatedValue = createAuthenticatedIpcWrapper();
    const result = await withAuthenticatedValue(ctx, async () => ({ id: 'ignored' }));

    expect(result).toEqual({
      ok: false,
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
    });
  });

  it('treats generic exceptions as internal errors by default', async () => {
    const ctx = createContext();
    const withAuthenticatedValue = createAuthenticatedIpcWrapper();

    const result = await withAuthenticatedValue(ctx, async () => {
      throw new Error('repository boot failure');
    });

    expect(result).toEqual({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal IPC error' },
    });
  });

  it('does not infer auth state from arbitrary error messages', async () => {
    const ctx = createContext({
      requireRequestContext: vi.fn().mockRejectedValue(new Error('AUTH_REQUIRED')),
    });

    const withAuthenticatedValue = createAuthenticatedIpcWrapper();
    const result = await withAuthenticatedValue(ctx, async () => ({ id: 'ignored' }));

    expect(result).toEqual({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal IPC error' },
    });
  });
});
