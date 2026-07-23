import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBoolean } from './parse-query-value';

/**
 * Residual 1021: notification parseBoolean dual retired onto parse-query-value sole.
 * Soft residual 1024: tip focused suite numbers track Residual 1024 evidence tip (302/1311).
 * Soft residual 989: parseString/parseNumber already sole for notification + reminder.
 * Soft residual 985: goal parseBoolean remains true/false-only keep-boundary.
 * Soft residual: schedule parseBoolean remains keep-boundary (boolean literal + empty shapes).
 * Does not flip §13.2 checkboxes.
 */
describe('parseQueryBoolean dual retired (residual 1021)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'parse-query-value.ts'), 'utf8');
  const index = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
  const notification = readFileSync(
    resolve(sharedDir, '../../../notification/src/api/routes.ts'),
    'utf8',
  );
  const schedule = readFileSync(
    resolve(sharedDir, '../../../schedule/src/api/routes.ts'),
    'utf8',
  );
  const goalSole = readFileSync(
    resolve(sharedDir, '../../../goal/src/api/routes/parse-boolean.ts'),
    'utf8',
  );

  it('owns sole parseBoolean helper body next to parseString/parseNumber', () => {
    expect(sole).toContain('Residual 1021');
    expect(sole).toMatch(/export function parseBoolean\b/);
    expect(sole).toContain("raw === 'true' || raw === '1'");
    expect(sole).toContain("raw === 'false' || raw === '0'");
    expect(sole).toContain('parseString(value)');
    expect(index).toContain("export * from './parse-query-value'");
  });

  it('notification imports sole without local dual body', () => {
    expect(notification).toContain('Residual 1021');
    expect(notification).toContain(
      "import { parseBoolean, parseNumber, parseString } from '@dailyuse/utils/shared'",
    );
    expect(notification).not.toMatch(/function parseBoolean\b/);
    expect(notification).toContain('parseBoolean(req.query?.isRead)');
  });

  it('schedule + goal remain keep-boundary vs this query boolean sole', () => {
    expect(schedule).toMatch(/function parseBoolean\b/);
    expect(schedule).toContain('value === true');
    expect(schedule).toContain("value === ''");
    expect(schedule).not.toContain('@dailyuse/utils/shared');
    expect(goalSole).toContain('Residual 985');
    expect(goalSole).toMatch(/export function parseBoolean\b/);
    expect(goalSole).not.toContain("'1'");
  });

  it('parses query-string true/false/1/0 via parseString normalization', () => {
    expect(parseBoolean(undefined)).toBeUndefined();
    expect(parseBoolean(null)).toBeUndefined();
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('false')).toBe(false);
    expect(parseBoolean('1')).toBe(true);
    expect(parseBoolean('0')).toBe(false);
    expect(parseBoolean(['0'])).toBe(false);
    expect(parseBoolean('maybe')).toBeUndefined();
  });
});
