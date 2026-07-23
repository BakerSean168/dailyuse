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
 * Residual 1049: auth result/catch failure duals retired onto reportAuthOperationFailure sole.
 * Soft residual 1050: tip focused suite numbers track Residual 1050 evidence tip (315/1363).
 * Does not flip §13.2 checkboxes.
 */
describe('reportAuthOperationFailure dual retired (residual 1049)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'reportAuthOperationFailure.ts'), 'utf8');
  const login = readFileSync(resolve(dir, 'useLogin.ts'), 'utf8');
  const register = readFileSync(resolve(dir, 'useRegister.ts'), 'utf8');
  const remembered = readFileSync(resolve(dir, 'useRememberedAccounts.ts'), 'utf8');

  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
  });

  it('owns sole reportAuthResultFailure + reportAuthCatchFailure bodies', () => {
    expect(sole).toContain('Residual 1049');
    expect(sole).toMatch(/export function reportAuthResultFailure\b/);
    expect(sole).toMatch(/export function reportAuthCatchFailure\b/);
    expect(sole).toContain("getLocalizedAuthError(error, 'auth.errors.UNKNOWN')");
    expect(sole).toContain("code: 'UNKNOWN'");
    expect(sole).toContain('store.setLoading(false)');
    expect(sole).toContain('toast.error');
  });

  it('login/register/remembered import sole without local dual failure bodies', () => {
    for (const [label, source] of [
      ['login', login],
      ['register', register],
      ['remembered', remembered],
    ] as const) {
      expect(source, label).toContain('Residual 1049');
      expect(source, label).toContain("from './reportAuthOperationFailure'");
      expect(source, label).toContain('reportAuthResultFailure(');
      expect(source, label).toContain('reportAuthCatchFailure(');
      expect(source, label).not.toMatch(/export function reportAuthResultFailure\b/);
      expect(source, label).not.toMatch(/export function reportAuthCatchFailure\b/);
      expect(source, label).not.toContain("code: 'UNKNOWN'");
      expect(source, label).not.toContain('console.error(`[auth]');
      expect(source, label).not.toContain("console.error('[auth]");
    }
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
