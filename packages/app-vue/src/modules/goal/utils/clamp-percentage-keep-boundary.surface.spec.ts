import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1083: goal clampPercentage keep-boundary.
 * Fixed 0–100 percentage domain with non-finite → 0 for goal/KR progress math.
 * Intentionally not shell clamp(value, min, max) geometry sole (variable range,
 * max < min fail-safe) — Residual 1001.
 * Soft residual 1001: shell clamp dual retired onto clamp.ts sole.
 * Does not flip §13.2 checkboxes.
 */
describe('goal clampPercentage keep-boundary (residual 1083)', () => {
  const dir = __dirname;
  const progress = readFileSync(resolve(dir, 'progress.ts'), 'utf8');
  const shellClamp = readFileSync(resolve(dir, '../../../layouts/shell/clamp.ts'), 'utf8');
  const clampSurface = readFileSync(
    resolve(dir, '../../../layouts/shell/clamp-dual.surface.spec.ts'),
    'utf8',
  );

  it('owns Residual 1083 keep-boundary markers on clampPercentage', () => {
    expect(progress).toContain('Residual 1083 keep-boundary');
    expect(progress).toMatch(/function clampPercentage\b/);
    expect(progress).toContain('Number.isFinite(value)');
    expect(progress).toContain('Math.min(100, Math.max(0, value))');
    expect(progress).toContain('getKeyResultProgressPercentage');
    expect(progress).toContain('getGoalOverallProgress');
    // must not import shell clamp sole
    expect(progress).not.toContain("from '../../../layouts/shell/clamp'");
    expect(progress).not.toContain("from '../../layouts/shell/clamp'");
    expect(progress).not.toMatch(/import\s*\{[^}]*\bclamp\b[^}]*\}/);
  });

  it('differs from shell clamp sole shape (no force-merge)', () => {
    expect(shellClamp).toMatch(/export function clamp\b/);
    expect(shellClamp).toContain('Residual 1001');
    expect(shellClamp).toContain('Soft residual 1083');
    expect(shellClamp).toContain('if (max < min) return min');
    expect(shellClamp).toContain('Math.max(min, Math.min(max, value))');
    // Soft residual may name keep-boundary; sole must not implement percentage helper
    expect(shellClamp).not.toMatch(/function clampPercentage\b/);
    expect(shellClamp).not.toContain('Number.isFinite');
    expect(shellClamp).not.toContain('Math.min(100, Math.max(0, value))');
    // keep-boundary body has fixed 0–100, not min/max params
    const start = progress.indexOf('function clampPercentage');
    expect(start).toBeGreaterThanOrEqual(0);
    const body = progress.slice(start, start + 220);
    expect(body).toContain('Number.isFinite(value)');
    expect(body).toContain('Math.min(100, Math.max(0, value))');
    expect(body).not.toContain('max < min');
    expect(body).not.toMatch(/function clampPercentage\([^)]*min/);
  });

  it('shell clamp dual surface documents soft residual 1083 keep-boundary', () => {
    expect(clampSurface).toContain('Soft residual 1083');
    expect(clampSurface).toContain('clampPercentage');
  });

  it('documents residual 1083 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'clamp-percentage-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1083');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
