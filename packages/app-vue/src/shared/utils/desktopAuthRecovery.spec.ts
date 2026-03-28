import { describe, expect, it, vi } from 'vitest';
import {
  ensureDesktopAuthReadyWithApi,
  isDesktopAuthRecoverable,
  recoverDesktopAuthIfNeeded,
} from './desktopAuthRecovery';

describe('desktopAuthRecovery', () => {
  it('recognizes recoverable desktop auth errors', () => {
    expect(isDesktopAuthRecoverable({ code: 'AUTH_REQUIRED' })).toBe(true);
    expect(isDesktopAuthRecoverable({ code: 'AUTH_RESTORING' })).toBe(true);
    expect(isDesktopAuthRecoverable({ code: 'UNAUTHORIZED' })).toBe(false);
    expect(isDesktopAuthRecoverable(undefined)).toBe(false);
  });

  it('initializes desktop auth when runtime is restoring', async () => {
    const invoke = vi
      .fn()
      .mockResolvedValueOnce({ authenticated: false, runtimeState: 'RESTORING' })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ authenticated: true });

    await expect(
      ensureDesktopAuthReadyWithApi({ invoke }, 'DesktopAuthRecoveryTest'),
    ).resolves.toBe(true);
    expect(invoke).toHaveBeenCalledTimes(3);
  });

  it('skips auth recovery for non-auth errors', async () => {
    const invoke = vi.fn();

    await expect(
      recoverDesktopAuthIfNeeded(
        { code: 'INTERNAL_ERROR' },
        { invoke },
        'DesktopAuthRecoveryTest',
      ),
    ).resolves.toBe(false);
    expect(invoke).not.toHaveBeenCalled();
  });
});
