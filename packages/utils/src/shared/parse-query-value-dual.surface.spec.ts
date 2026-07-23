import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBoolean, parseNumber, parseString } from './parse-query-value';

/**
 * Residual 989: parseString + parseNumber dual retired (notification + reminder API routes).
 * Residual 1021: parseBoolean dual retired for notification query filters.
 * Sole body in @dailyuse/utils/shared/parse-query-value.
 * Soft residual 1030: tip focused suite numbers track Residual 1030 evidence tip (305/1323).
 * Soft residual 1023: governance parseString/parseNumber dual retired (re-export this sole).
 * Soft residual: schedule route parsers keep-boundary (different empty/boolean handling).
 * Soft residual: goal parseBoolean sole (residual 985) is true/false-only keep-boundary vs this dual.
 * Does not flip §13.2 checkboxes.
 */
describe('parseString/parseNumber dual retired (residual 989)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'parse-query-value.ts'), 'utf8');
  const index = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
  const notification = readFileSync(
    resolve(sharedDir, '../../../notification/src/api/routes.ts'),
    'utf8',
  );
  const reminder = readFileSync(
    resolve(sharedDir, '../../../reminder/src/api/routes/reminder-template.routes.ts'),
    'utf8',
  );
  const schedule = readFileSync(
    resolve(sharedDir, '../../../schedule/src/api/routes.ts'),
    'utf8',
  );

  it('owns sole parseString + parseNumber + parseBoolean bodies and shared barrel export', () => {
    expect(sole).toContain('Residual 989');
    expect(sole).toContain('Residual 1021');
    expect(sole).toMatch(/export function parseString\b/);
    expect(sole).toMatch(/export function parseNumber\b/);
    expect(sole).toMatch(/export function parseBoolean\b/);
    expect(sole).toContain('Array.isArray(value)');
    expect(sole).toContain('Number.isFinite(parsed)');
    expect(sole).toContain("'1'");
    expect(index).toContain("export * from './parse-query-value'");
  });

  it('notification + reminder routes import sole without local dual bodies', () => {
    expect(notification).toContain('Residual 989');
    expect(notification).toContain('Residual 1021');
    expect(notification).toContain(
      "import { parseBoolean, parseNumber, parseString } from '@dailyuse/utils/shared'",
    );
    expect(notification).not.toMatch(/function parseString\b/);
    expect(notification).not.toMatch(/function parseNumber\b/);
    expect(notification).not.toMatch(/function parseBoolean\b/);
    expect(notification).toContain('parseString(');
    expect(notification).toContain('parseNumber(');
    expect(notification).toContain('parseBoolean(');

    expect(reminder).toContain('Residual 989');
    expect(reminder).toContain(
      "import { parseNumber, parseString } from '@dailyuse/utils/shared'",
    );
    expect(reminder).not.toMatch(/function parseString\b/);
    expect(reminder).not.toMatch(/function parseNumber\b/);
    expect(reminder).toContain('parseString(');
    expect(reminder).toContain('parseNumber(');
  });

  it('schedule route parsers remain keep-boundary (not this sole dual body)', () => {
    expect(schedule).toMatch(/function parseString\b/);
    expect(schedule).toMatch(/function parseNumber\b/);
    expect(schedule).toContain("value === ''");
    expect(schedule).not.toContain('@dailyuse/utils/shared');
  });

  it('parses first query string entry and finite numbers', () => {
    expect(parseString(undefined)).toBeUndefined();
    expect(parseString(null)).toBeUndefined();
    expect(parseString('status')).toBe('status');
    expect(parseString(['a', 'b'])).toBe('a');
    expect(parseString([])).toBeUndefined();
    expect(parseString(42)).toBe('42');

    expect(parseNumber(undefined)).toBeUndefined();
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber('12')).toBe(12);
    expect(parseNumber(['3.5'])).toBe(3.5);
    expect(parseNumber('nope')).toBeUndefined();

    expect(parseBoolean(undefined)).toBeUndefined();
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('1')).toBe(true);
    expect(parseBoolean('false')).toBe(false);
    expect(parseBoolean('0')).toBe(false);
    expect(parseBoolean('yes')).toBeUndefined();
    expect(parseBoolean(['true'])).toBe(true);
  });
});
