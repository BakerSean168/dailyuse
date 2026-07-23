import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clamp } from './clamp';

/**
 * Residual 1001: clamp dual retired (panel-geometry + useAppShellStore).
 * Sole body in clamp.ts with max < min fail-safe.
 * Soft residual 1004: tip focused suite numbers track Residual 1004 evidence tip (292/1272).
 * Does not flip §13.2 checkboxes.
 */
describe('clamp dual retired (residual 1001)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'clamp.ts'), 'utf8');
  const panelGeometry = readFileSync(resolve(dir, 'panel-geometry.ts'), 'utf8');
  const appShellStore = readFileSync(resolve(dir, 'useAppShellStore.ts'), 'utf8');

  it('owns sole clamp helper body with inverted-range fail-safe', () => {
    expect(sole).toContain('Residual 1001');
    expect(sole).toMatch(/export function clamp\b/);
    expect(sole).toContain('if (max < min) return min');
    expect(sole).toContain('Math.max(min, Math.min(max, value))');
  });

  it('panel-geometry + useAppShellStore import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['panel-geometry', panelGeometry],
      ['useAppShellStore', appShellStore],
    ] as const) {
      expect(source, label).toContain('Residual 1001');
      expect(source, label).toContain("import { clamp } from './clamp'");
      expect(source, label).not.toMatch(/function clamp\b/);
      expect(source, label).toContain('clamp(');
    }
  });

  it('clamps into range and fails safe when max < min', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
    expect(clamp(3, 5, 2)).toBe(5);
  });
});
