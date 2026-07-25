import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1079: removeRememberedAccount toast-only keep-boundary.
 * Soft-delete of a remembered account toasts without store.setError and without
 * reportAuthOperationFailure (toast+setError dual shape for login/register/guest).
 * Soft residual 1049: loginRememberedDesktopAccount still uses reportAuth sole.
 * Soft residual 1075: password/checkAvailability toast-only keep-boundary remains.
 * Soft residual 1077: autoLoginDesktop AutoLoginResult keep-boundary remains.
 * Does not flip §13.2 checkboxes.
 */
describe('removeRememberedAccount toast-only keep-boundary (residual 1079)', () => {
  const dir = __dirname;
  const remembered = readFileSync(resolve(dir, 'useRememberedAccounts.ts'), 'utf8');
  const reportSole = readFileSync(resolve(dir, 'reportAuthOperationFailure.ts'), 'utf8');

  it('owns Residual 1079 keep-boundary markers on removeRememberedAccount', () => {
    expect(remembered).toContain('Residual 1079 keep-boundary');
    expect(remembered).toMatch(/async function removeRememberedAccount\b/);
    expect(remembered).toContain('auth.toast.removeRememberedAccountFailed');
    expect(remembered).toContain('toast.error');
    expect(remembered).toContain('getLocalizedAuthError');
    expect(remembered).toContain('lastResultError.value = result.error');
  });

  it('removeRememberedAccount does not use reportAuth sole or store.setError', () => {
    const start = remembered.indexOf('async function removeRememberedAccount');
    expect(start).toBeGreaterThanOrEqual(0);
    const end = remembered.indexOf('\n  return {', start);
    const body = remembered.slice(start, end > start ? end : start + 800);
    expect(body).toContain('Residual 1079 keep-boundary');
    expect(body).toContain('toast.error');
    expect(body).not.toContain('reportAuthResultFailure');
    expect(body).not.toContain('reportAuthCatchFailure');
    expect(body).not.toMatch(/store\.setError\s*\(/);
  });

  it('loginRememberedDesktopAccount still uses reportAuth sole (residual 1049)', () => {
    expect(remembered).toContain('Residual 1049');
    expect(remembered).toContain('reportAuthResultFailure');
    expect(remembered).toContain('reportAuthCatchFailure');
    expect(remembered).toContain('completeAuthSuccess');
  });

  it('differs from reportAuthOperationFailure sole shape (no force-merge)', () => {
    expect(reportSole).toMatch(/export function reportAuthResultFailure\b/);
    expect(reportSole).toContain('Soft residual 1079');
    expect(reportSole).toContain('store.setError');
    expect(reportSole).toContain('toast.error');
    // Soft residual may name keep-boundary; body must not implement removeRememberedAccount
    expect(reportSole).not.toMatch(/function removeRememberedAccount\b/);
    expect(reportSole).not.toContain('removeRememberedAccountFailed');
  });

  it('documents residual 1079 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'remove-remembered-toast-only-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1079');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
