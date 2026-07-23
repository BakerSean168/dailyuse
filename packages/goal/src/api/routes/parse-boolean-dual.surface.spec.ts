import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBoolean } from './parse-boolean';

/**
 * Residual 985: parseBoolean dual retired (goal API routes).
 * Sole body in parse-boolean.ts; goal + goal-folder routes import it.
 * Soft residual 1036: tip focused suite numbers track Residual 1036 evidence tip (308/1335).
 * Does not flip §13.2 checkboxes.
 */
describe('parseBoolean dual retired (residual 985)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'parse-boolean.ts'), 'utf8');
  const goal = readFileSync(resolve(dir, 'goal.routes.ts'), 'utf8');
  const folder = readFileSync(resolve(dir, 'goal-folder.routes.ts'), 'utf8');

  it('owns sole parseBoolean helper body', () => {
    expect(sole).toContain('Residual 985');
    expect(sole).toMatch(/export function parseBoolean\b/);
    expect(sole).toContain("value === 'true'");
    expect(sole).toContain("value === 'false'");
  });

  it('goal + goal-folder routes import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['goal', goal],
      ['folder', folder],
    ] as const) {
      expect(source, label).toContain('Residual 985');
      expect(source, label).toContain("import { parseBoolean } from './parse-boolean'");
      expect(source, label).not.toMatch(/function parseBoolean\b/);
      expect(source, label).toContain('parseBoolean(');
    }
  });

  it('maps query string true/false and rejects other values', () => {
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('false')).toBe(false);
    expect(parseBoolean(undefined)).toBeUndefined();
    expect(parseBoolean(null)).toBeUndefined();
    expect(parseBoolean('1')).toBeUndefined();
    expect(parseBoolean(true)).toBeUndefined();
    expect(parseBoolean(['true'])).toBeUndefined();
  });
});
