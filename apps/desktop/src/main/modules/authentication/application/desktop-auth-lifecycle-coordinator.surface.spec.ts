import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Auth lifecycle coordinator surface (stage-6 residual 70):
 * initialize idempotent path returns ok, not success dual-track.
 * Residual 883 (soft): SessionRestoreResult layered extension keep-boundary
 *   (session-restore-result-extension-keep-boundary.surface.spec.ts).
 * Residual 935 (soft): LifecycleSessionRestoreResult sole lifecycle name dual retired.
 */
describe('desktop-auth-lifecycle-coordinator LifecycleSessionRestoreResult surface', () => {
  const source = readFileSync(
    resolve(__dirname, 'desktop-auth-lifecycle-coordinator.ts'),
    'utf8',
  );

  it('returns ok on already-initialized path without success dual-track', () => {
    expect(source).toContain('ok: true');
    expect(source).not.toMatch(/success:\s*true/);
    expect(source).not.toMatch(/success:\s*false/);
    expect(source).toContain('hasValidSession:');
    expect(source).toContain('LifecycleSessionRestoreResult');
    expect(source).not.toMatch(/export interface SessionRestoreResult\b/);
  });
});
