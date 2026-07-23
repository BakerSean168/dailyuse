import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isRecord as aiIsRecord } from './isRecord';

/**
 * Residual 1089: isRecord cross-package keep-boundary.
 * app-vue AI isRecord: plain-object only (rejects arrays / null / falsey).
 * desktop http-envelope-guards isRecord: any non-null object (arrays allowed).
 * Intentionally not force-merged — different domain contracts (workflow data vs JSON envelope).
 * Soft residual 951: AI local duals retired onto app-vue isRecord sole.
 * Soft residual 947: desktop gateway duals retired onto http-envelope-guards sole.
 * Soft residual 1139: sanitize-for-ipc isPlainObject prototype-strict keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('isRecord cross-package keep-boundary (residual 1089)', () => {
  const dir = __dirname;
  const aiSole = readFileSync(resolve(dir, 'isRecord.ts'), 'utf8');
  const desktopSole = readFileSync(
    resolve(dir, '../../../../../../apps/desktop/src/main/utils/http-envelope-guards.ts'),
    'utf8',
  );
  const desktopSurface = readFileSync(
    resolve(
      dir,
      '../../../../../../apps/desktop/src/main/utils/http-envelope-guards-dual.surface.spec.ts',
    ),
    'utf8',
  );
  const aiDualSurface = readFileSync(resolve(dir, 'is-record-dual.surface.spec.ts'), 'utf8');

  it('owns Residual 1089 keep-boundary markers on AI plain-object isRecord', () => {
    expect(aiSole).toContain('Residual 1089 keep-boundary');
    expect(aiSole).toMatch(/export function isRecord\b/);
    expect(aiSole).toContain("Boolean(value) && typeof value === 'object' && !Array.isArray(value)");
    expect(aiSole).toContain('plain-object');
  });

  it('differs from desktop envelope isRecord shape (no force-merge)', () => {
    expect(desktopSole).toMatch(/export function isRecord\b/);
    expect(desktopSole).toContain('Residual 947');
    expect(desktopSole).toContain('Soft residual 1089');
    expect(desktopSole).toContain("value !== null && typeof value === 'object'");
    // Soft residual may name keep-boundary; desktop must not implement AI plain-object reject-array body
    expect(desktopSole).not.toContain('!Array.isArray(value)');
    expect(desktopSole).not.toContain('Boolean(value)');
    // AI sole must not use desktop-style arrays-allowed body
    expect(aiSole).not.toContain("value !== null && typeof value === 'object'");
    expect(aiSole).toContain('!Array.isArray(value)');
  });

  it('runtime: AI rejects arrays while desktop dual surface documents arrays allowed', () => {
    expect(aiIsRecord([])).toBe(false);
    expect(aiIsRecord({ a: 1 })).toBe(true);
    expect(aiIsRecord(null)).toBe(false);
    // desktop surface runtime assertion exists for arrays allowed
    expect(desktopSurface).toContain('expect(isRecord([])).toBe(true)');
    expect(desktopSurface).toContain('Soft residual 1089');
    expect(aiDualSurface).toContain('Soft residual 1089');
  });

  it('documents residual 1089 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'is-record-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1089');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
