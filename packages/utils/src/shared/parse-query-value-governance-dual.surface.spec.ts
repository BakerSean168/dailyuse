import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseNumber, parseString } from './parse-query-value';

/**
 * Residual 1023: governance parseString/parseNumber dual retired onto residual 989 sole.
 * governance-route-shared re-exports utils sole; parseStringArray remains package-local.
 * Soft residual 1022: tip focused suite numbers track Residual 1022 evidence tip (301/1307)
 *   until residual 1024 suite re-run.
 * Soft residual: schedule route parsers remain keep-boundary (empty-string shapes).
 * Soft residual 1021: notification parseBoolean sole family.
 * Does not flip §13.2 checkboxes.
 */
describe('governance parseString/parseNumber dual retired (residual 1023)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'parse-query-value.ts'), 'utf8');
  const govShared = readFileSync(
    resolve(sharedDir, '../../../governance/src/api/routes/governance-route-shared.ts'),
    'utf8',
  );
  const rules = readFileSync(
    resolve(sharedDir, '../../../governance/src/api/routes/governance-rules.routes.ts'),
    'utf8',
  );
  const revisions = readFileSync(
    resolve(
      sharedDir,
      '../../../governance/src/api/routes/governance-rule-revisions.routes.ts',
    ),
    'utf8',
  );
  const schedule = readFileSync(
    resolve(sharedDir, '../../../schedule/src/api/routes.ts'),
    'utf8',
  );

  it('owns residual 989 sole parseString/parseNumber bodies', () => {
    expect(sole).toContain('Residual 989');
    expect(sole).toMatch(/export function parseString\b/);
    expect(sole).toMatch(/export function parseNumber\b/);
    expect(sole).toContain('Array.isArray(value)');
    expect(sole).toContain('Number.isFinite(parsed)');
  });

  it('governance-route-shared re-exports utils sole without local dual bodies', () => {
    expect(govShared).toContain('Residual 1023');
    expect(govShared).toContain("export { parseNumber, parseString } from '@dailyuse/utils/shared'");
    expect(govShared).not.toMatch(/export function parseString\b/);
    expect(govShared).not.toMatch(/export function parseNumber\b/);
    expect(govShared).toMatch(/export function parseStringArray\b/);
  });

  it('governance routes import shared re-export without local dual bodies', () => {
    expect(rules).toContain("from './governance-route-shared'");
    expect(rules).toContain('parseString');
    expect(rules).toContain('parseNumber');
    expect(rules).toContain('parseStringArray');
    expect(rules).not.toMatch(/function parseString\b/);
    expect(rules).not.toMatch(/function parseNumber\b/);
    expect(revisions).toContain("from './governance-route-shared'");
    expect(revisions).toContain('parseNumber');
    expect(revisions).not.toMatch(/function parseNumber\b/);
  });

  it('schedule remains keep-boundary; sole still parses arrays and finite numbers', () => {
    expect(schedule).toMatch(/function parseString\b/);
    expect(schedule).toContain("value === ''");
    expect(schedule).not.toContain('@dailyuse/utils/shared');
    expect(parseString(['a', 'b'])).toBe('a');
    expect(parseNumber('12')).toBe(12);
    expect(parseNumber('nope')).toBeUndefined();
  });
});
