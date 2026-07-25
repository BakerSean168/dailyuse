import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1073: schedule route-local parseString/parseNumber/parseBoolean keep-boundary.
 * Empty string short-circuits to undefined; parseBoolean accepts boolean literals.
 * Intentionally not force-merged into utils parse-query-value sole (residual 989/1021):
 * utils parseString prefers first array entry and has no empty-string early return;
 * utils parseBoolean accepts "1"/"0" strings only (no boolean literals).
 * Soft residual 1067/1069: goal/governance parse helpers remain package-local too.
 * Soft residual 1113: data-portability toBoolean keep-boundary (fallback boolean; no force-merge).
 * Does not flip §13.2 checkboxes.
 */
describe('schedule route parsers keep-boundary (residual 1073)', () => {
  const dir = __dirname;
  const routes = readFileSync(resolve(dir, 'routes.ts'), 'utf8');
  const utilsSole = readFileSync(
    resolve(dir, '../../../utils/src/shared/parse-query-value.ts'),
    'utf8',
  );

  it('owns residual 1073 keep-boundary markers on local parsers', () => {
    expect(routes).toContain('Residual 1073 keep-boundary');
    expect(routes).toMatch(/function parseNumber\b/);
    expect(routes).toMatch(/function parseString\b/);
    expect(routes).toMatch(/function parseBoolean\b/);
    expect(routes).toContain("value === ''");
    expect(routes).toContain('value === true');
    expect(routes).toContain('value === false');
    expect(routes).toContain('isNaN(num)');
    expect(routes).not.toContain('@dailyuse/utils/shared');
  });

  it('differs from utils parse-query-value sole shape (no force-merge)', () => {
    expect(utilsSole).toMatch(/export function parseString\b/);
    expect(utilsSole).toMatch(/export function parseNumber\b/);
    expect(utilsSole).toMatch(/export function parseBoolean\b/);
    expect(utilsSole).toContain('Soft residual 1073');
    // utils array-first string + 1/0 boolean; no empty-string short-circuit on parseString
    expect(utilsSole).toContain('Array.isArray(value)');
    expect(utilsSole).toContain("raw === '1'");
    expect(utilsSole).toContain("raw === '0'");
    expect(utilsSole).not.toContain('value === true');
    expect(routes).not.toContain("raw === '1'");
    expect(routes).not.toContain('Array.isArray(value)');
  });

  it('documents residual 1073 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'schedule-route-parsers-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1073');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
