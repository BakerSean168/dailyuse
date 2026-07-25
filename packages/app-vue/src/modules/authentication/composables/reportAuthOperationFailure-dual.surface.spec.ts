import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'vue-sonner';
import {
  reportAuthCatchFailure,
  reportAuthResultFailure,
} from './reportAuthOperationFailure';

/**
 * Residual 1049/1051: auth result/catch failure duals retired onto reportAuthOperationFailure sole.
 * Callers: login / register / remembered-desktop / enterGuestMode.
 * Soft residual: removeRememberedAccount keeps local toast path (no store.setError dual body).
 * Soft residual 1079: removeRememberedAccount toast-only keep-boundary surface (no force-merge).
 * Soft residual: autoLoginDesktop returns AutoLoginResult (shape keep-boundary, no toast dual).
 * Soft residual 1077: autoLoginDesktop AutoLoginResult keep-boundary surface (no force-merge).
 * Does not flip §13.2 checkboxes.
 */
describe('reportAuthOperationFailure dual retired (residual 1049/1051)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'reportAuthOperationFailure.ts'), 'utf8');
  const login = readFileSync(resolve(dir, 'useLogin.ts'), 'utf8');
  const register = readFileSync(resolve(dir, 'useRegister.ts'), 'utf8');
  const remembered = readFileSync(resolve(dir, 'useRememberedAccounts.ts'), 'utf8');
  const guest = readFileSync(resolve(dir, 'useGuestMode.ts'), 'utf8');

  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
  });

  it('owns sole reportAuthResultFailure + reportAuthCatchFailure bodies', () => {
    expect(sole).toMatch(/Residual 1049\/1051|Residual 1049/);
    expect(sole).toContain('useGuestMode');
    expect(sole).toMatch(/export function reportAuthResultFailure\b/);
    expect(sole).toMatch(/export function reportAuthCatchFailure\b/);
    expect(sole).toContain("getLocalizedAuthError(error, 'auth.errors.UNKNOWN')");
    expect(sole).toContain("code: 'UNKNOWN'");
    expect(sole).toContain('store.setLoading(false)');
    expect(sole).toContain('toast.error');
  });

  it('login/register/remembered/guest import sole without local dual failure bodies', () => {
    for (const [label, source, residualMarker] of [
      ['login', login, 'Residual 1049'],
      ['register', register, 'Residual 1049'],
      ['remembered', remembered, 'Residual 1049'],
      ['guest', guest, 'Residual 1051'],
    ] as const) {
      expect(source, label).toContain(residualMarker);
      expect(source, label).toContain("from './reportAuthOperationFailure'");
      expect(source, label).toContain('reportAuthResultFailure(');
      expect(source, label).toContain('reportAuthCatchFailure(');
      expect(source, label).not.toMatch(/export function reportAuthResultFailure\b/);
      expect(source, label).not.toMatch(/export function reportAuthCatchFailure\b/);
    }
    // enterGuestMode dual body retired (guest still has autoLoginDesktop local UNKNOWN shape)
    expect(guest).not.toContain("console.error('[auth] enterGuestMode failed'");
    expect(guest).toContain("reportAuthCatchFailure(failureDeps, e, 'enterGuestMode'");
    expect(guest).toContain("reportAuthResultFailure(failureDeps, result.error, 'auth.toast.guestModeFailed')");
    // soft residual: removeRememberedAccount keeps non-store toast path
    expect(remembered).toContain('removeRememberedAccount');
    expect(remembered).toContain('auth.toast.removeRememberedAccountFailed');
  });

  it('reportAuthResultFailure sets store error and toasts', () => {
    const store = { setError: vi.fn(), setLoading: vi.fn() };
    const lastResultError = { value: null as unknown };
    const deps = {
      store: store as never,
      t: (key: string) => key,
      lastResultError: lastResultError as never,
      getLocalizedAuthError: () => 'localized',
    };
    const error = { code: 'X', message: 'm' } as never;
    expect(reportAuthResultFailure(deps, error, 'auth.toast.loginFailed')).toBe(false);
    expect(lastResultError.value).toBe(error);
    expect(store.setError).toHaveBeenCalledWith('localized');
    expect(toast.error).toHaveBeenCalledWith('auth.toast.loginFailed', {
      description: 'localized',
    });
  });

  it('reportAuthCatchFailure clears loading, records unknown error, and toasts', () => {
    const store = { setError: vi.fn(), setLoading: vi.fn() };
    const lastResultError = { value: null as unknown };
    const deps = {
      store: store as never,
      t: (key: string) => key,
      lastResultError: lastResultError as never,
      getLocalizedAuthError: () => 'catch-localized',
    };
    expect(
      reportAuthCatchFailure(deps, new Error('boom'), 'loginByEmail', 'auth.toast.loginFailed'),
    ).toBe(false);
    expect(store.setLoading).toHaveBeenCalledWith(false);
    expect(lastResultError.value).toEqual({ code: 'UNKNOWN', message: 'boom' });
    expect(store.setError).toHaveBeenCalledWith('catch-localized');
    expect(toast.error).toHaveBeenCalledWith('auth.toast.loginFailed', {
      description: 'catch-localized',
    });
  });
});
