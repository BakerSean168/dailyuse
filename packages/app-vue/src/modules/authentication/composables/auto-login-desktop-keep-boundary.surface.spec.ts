import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1077: autoLoginDesktop AutoLoginResult shape keep-boundary.
 * Desktop auto-login returns AutoLoginResult (ok/authenticated/error) after
 * store.setError + getLocalizedAuthError; intentionally not toast dual and not
 * reportAuthOperationFailure sole (which toasts + sets error for login/register/guest).
 * Soft residual 1051: enterGuestMode failure duals retired onto reportAuth sole.
 * Soft residual 1075: password/checkAvailability toast-only keep-boundary remains.
 * Does not flip §13.2 checkboxes.
 */
describe('autoLoginDesktop AutoLoginResult keep-boundary (residual 1077)', () => {
  const dir = __dirname;
  const guest = readFileSync(resolve(dir, 'useGuestMode.ts'), 'utf8');
  const reportSole = readFileSync(resolve(dir, 'reportAuthOperationFailure.ts'), 'utf8');
  const reportSurface = readFileSync(
    resolve(dir, 'reportAuthOperationFailure-dual.surface.spec.ts'),
    'utf8',
  );

  it('owns Residual 1077 keep-boundary markers on autoLoginDesktop', () => {
    expect(guest).toContain('Residual 1077 keep-boundary');
    expect(guest).toMatch(/async function autoLoginDesktop\b/);
    expect(guest).toContain('Promise<AutoLoginResult>');
    expect(guest).toContain("from '@memoflow/contracts/authentication'");
    expect(guest).toContain('AutoLoginResult');
    expect(guest).toContain('store.setError');
    expect(guest).toContain('getLocalizedAuthError');
    expect(guest).toContain('return result.data');
    expect(guest).toContain("return { ok: false, authenticated: false, error:");
    // Must not toast dual on this path
    expect(guest).not.toMatch(/autoLoginDesktop[\s\S]{0,1200}toast\.(error|success)/);
  });

  it('differs from reportAuthOperationFailure sole shape (no force-merge)', () => {
    expect(reportSole).toMatch(/export function reportAuthResultFailure\b/);
    expect(reportSole).toMatch(/export function reportAuthCatchFailure\b/);
    expect(reportSole).toContain('Soft residual 1077');
    // Sole is toast+setError failure reporter returning boolean, not AutoLoginResult
    expect(reportSole).toContain('toast.error');
    // Soft residual comment may name the keep-boundary; body must not implement it
    expect(reportSole).not.toMatch(/export (type|interface|function) AutoLoginResult\b/);
    expect(reportSole).not.toMatch(/Promise<AutoLoginResult>/);
    expect(reportSole).not.toMatch(/function autoLoginDesktop\b/);
    // Guest mode uses reportAuth for enterGuestMode only, not autoLoginDesktop
    expect(guest).toContain('reportAuthResultFailure');
    expect(guest).toContain('reportAuthCatchFailure');
    expect(guest).toContain('enterGuestMode');
    // autoLoginDesktop block must not call reportAuth helpers
    const start = guest.indexOf('async function autoLoginDesktop');
    const end = guest.indexOf('return {', start);
    // find end of function roughly via next return block at function level - use slice to next "  return {" of module
    const fnEnd = guest.indexOf('\n  return {', start);
    const autoBody = guest.slice(start, fnEnd > start ? fnEnd : start + 1500);
    expect(autoBody).not.toContain('reportAuthResultFailure');
    expect(autoBody).not.toContain('reportAuthCatchFailure');
    expect(autoBody).not.toContain('toast.');
  });

  it('reportAuth dual surface documents soft residual 1077 keep-boundary', () => {
    expect(reportSurface).toContain('Soft residual 1077');
    expect(reportSurface).toContain('autoLoginDesktop');
  });

  it('documents residual 1077 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'auto-login-desktop-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1077');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
