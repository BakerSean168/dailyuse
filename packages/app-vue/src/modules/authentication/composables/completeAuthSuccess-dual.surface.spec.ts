import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../shared/utils/desktop-auth-recovery', () => ({
  hasDesktopAuthApi: vi.fn(),
}));

import { toast } from 'vue-sonner';
import { hasDesktopAuthApi } from '../../../shared/utils/desktop-auth-recovery';
import { completeAuthSuccess } from './completeAuthSuccess';

/**
 * Residual 1045: completeAuthSuccess dual retired onto composable sole.
 * Soft residual 1046: tip focused suite numbers track Residual 1046 evidence tip (313/1355).
 * Does not flip §13.2 checkboxes.
 */
describe('completeAuthSuccess dual retired (residual 1045)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'completeAuthSuccess.ts'), 'utf8');
  const login = readFileSync(resolve(dir, 'useLogin.ts'), 'utf8');
  const register = readFileSync(resolve(dir, 'useRegister.ts'), 'utf8');
  const remembered = readFileSync(resolve(dir, 'useRememberedAccounts.ts'), 'utf8');

  beforeEach(() => {
    vi.mocked(toast.success).mockReset();
    vi.mocked(hasDesktopAuthApi).mockReset();
  });

  it('owns sole completeAuthSuccess helper body', () => {
    expect(sole).toContain('Residual 1045');
    expect(sole).toMatch(/export async function completeAuthSuccess\b/);
    expect(sole).toContain('hasDesktopAuthApi(window)');
    expect(sole).toContain('deps.resetStore()');
    expect(sole).toContain('deps.handleAuthSuccess(data)');
    expect(sole).toContain("deps.redirectWithReload('/')");
    expect(sole).toContain('toast.success(title, { description })');
  });

  it('login/register/remembered composables import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['login', login],
      ['register', register],
      ['remembered', remembered],
    ] as const) {
      expect(source, label).toContain('Residual 1045');
      expect(source, label).toContain("from './completeAuthSuccess'");
      expect(source, label).toContain('completeAuthSuccess(');
      expect(source, label).not.toMatch(/async function completeAuthSuccess\b/);
      expect(source, label).not.toContain('hasDesktopAuthApi(window)');
      expect(source, label).not.toMatch(
        /import \{ hasDesktopAuthApi \} from '\.\.\/\.\.\/\.\.\/shared\/utils\/desktop-auth-recovery'/,
      );
    }
  });

  it('web path applies handleAuthSuccess, toasts, and redirects', async () => {
    vi.mocked(hasDesktopAuthApi).mockReturnValue(false);
    const resetStore = vi.fn();
    const handleAuthSuccess = vi.fn();
    const redirectWithReload = vi.fn();
    const data = { token: 't' } as never;

    const ok = await completeAuthSuccess(
      { resetStore, handleAuthSuccess, redirectWithReload },
      data,
      'title',
      'desc',
    );

    expect(ok).toBe(true);
    expect(resetStore).not.toHaveBeenCalled();
    expect(handleAuthSuccess).toHaveBeenCalledWith(data);
    expect(toast.success).toHaveBeenCalledWith('title', { description: 'desc' });
    expect(redirectWithReload).toHaveBeenCalledWith('/');
  });

  it('desktop path resets store, toasts, and skips redirect', async () => {
    vi.mocked(hasDesktopAuthApi).mockReturnValue(true);
    const resetStore = vi.fn();
    const handleAuthSuccess = vi.fn();
    const redirectWithReload = vi.fn();
    const data = { token: 't' } as never;

    const ok = await completeAuthSuccess(
      { resetStore, handleAuthSuccess, redirectWithReload },
      data,
      'title',
      'desc',
    );

    expect(ok).toBe(true);
    expect(resetStore).toHaveBeenCalledOnce();
    expect(handleAuthSuccess).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('title', { description: 'desc' });
    expect(redirectWithReload).not.toHaveBeenCalled();
  });
});
