import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseStringArray } from './governance-route-shared';

/**
 * Residual 1069: governance package-local parseStringArray keep-boundary.
 * Intentionally not force-merged with:
 * - goal.routes parseStringArray (returns empty array; no array-item trim)
 * - utils persistence parseStringArray (JSON string domain)
 * - residual 989 parse-query-value sole (no parseStringArray body)
 * Soft residual 1023: parseString/parseNumber re-export from utils sole remains.
 * Soft residual 1067: goal parseNumber/parseStringArray keep-boundary remains.
 * Does not flip §13.2 checkboxes.
 */
describe('governance parseStringArray keep-boundary (residual 1069)', () => {
  const dir = __dirname;
  const shared = readFileSync(resolve(dir, 'governance-route-shared.ts'), 'utf8');
  const rules = readFileSync(resolve(dir, 'governance-rules.routes.ts'), 'utf8');
  const goalRoutes = readFileSync(
    resolve(dir, '../../../../goal/src/api/routes/goal.routes.ts'),
    'utf8',
  );
  const utilsSole = readFileSync(
    resolve(dir, '../../../../utils/src/shared/parse-query-value.ts'),
    'utf8',
  );
  const utilsPersistence = readFileSync(
    resolve(dir, '../../../../utils/src/shared/persistence.ts'),
    'utf8',
  );

  it('owns residual 1069 keep-boundary markers on local parseStringArray', () => {
    expect(shared).toContain('Residual 1069 keep-boundary');
    expect(shared).toMatch(/export function parseStringArray\b/);
    expect(shared).toContain("export { parseNumber, parseString } from '@dailyuse/utils/shared'");
    expect(shared).toContain('items.length > 0 ? items : undefined');
    expect(shared).toContain('.split(\',\')');
    expect(shared).toContain('.trim()');
    // Must not import utils persistence parseStringArray for this HTTP query helper
    expect(shared).not.toContain("parseStringArray } from '@dailyuse/utils/shared'");
    expect(shared).not.toContain("parseStringArray} from '@dailyuse/utils/shared'");
  });

  it('rules route consumes shared parseStringArray without local dual body', () => {
    expect(rules).toContain("from './governance-route-shared'");
    expect(rules).toContain('parseStringArray');
    expect(rules).not.toMatch(/function parseStringArray\b/);
  });

  it('differs from goal.routes parseStringArray keep-boundary (no force-merge)', () => {
    expect(goalRoutes).toContain('Residual 1067 keep-boundary');
    expect(goalRoutes).toMatch(/function parseStringArray\b/);
    // goal returns filtered array even when empty; governance collapses empty → undefined
    expect(goalRoutes).not.toContain('items.length > 0 ? items : undefined');
    // goal array path uses map(String) without per-item trim
    expect(goalRoutes).toContain('value.map(String).filter(Boolean)');
    expect(shared).not.toContain('value.map(String).filter(Boolean)');
  });

  it('differs from utils query sole and persistence JSON parseStringArray', () => {
    expect(utilsSole).not.toMatch(/export function parseStringArray\b/);
    expect(utilsSole).toContain('Soft residual 1067');
    expect(utilsPersistence).toMatch(/export function parseStringArray\b/);
    expect(utilsPersistence).toContain('JSON.parse');
    expect(shared).not.toContain('JSON.parse');
  });

  it('parses query arrays/comma-strings and collapses empty to undefined', () => {
    expect(parseStringArray(['a', ' b '])).toEqual(['a', 'b']);
    expect(parseStringArray('x, y')).toEqual(['x', 'y']);
    expect(parseStringArray(['', '  '])).toBeUndefined();
    expect(parseStringArray('')).toBeUndefined();
    expect(parseStringArray(undefined)).toBeUndefined();
    expect(parseStringArray(null)).toBeUndefined();
    expect(parseStringArray(42)).toBeUndefined();
  });

  it('documents residual 1069 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'governance-parse-string-array-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1069');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
