import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toIso } from './to-iso';

/**
 * Residual 981: toIso dual retired (PowerSync auth mappers).
 * Sole body in to-iso.ts; identity + session mappers import it.
 * Soft residual 1026: tip focused suite numbers track Residual 1026 evidence tip (303/1315).
 * Does not flip §13.2 checkboxes.
 */
describe('toIso dual retired (residual 981)', () => {
  const dir = __dirname;
  const sole = readFileSync(resolve(dir, 'to-iso.ts'), 'utf8');
  const identity = readFileSync(resolve(dir, 'powersync-auth-identity.mapper.ts'), 'utf8');
  const session = readFileSync(resolve(dir, 'powersync-auth-session.mapper.ts'), 'utf8');

  it('owns sole toIso helper body', () => {
    expect(sole).toContain('Residual 981');
    expect(sole).toMatch(/export function toIso\b/);
    expect(sole).toContain('new Date(value).toISOString()');
  });

  it('identity + session mappers import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['identity', identity],
      ['session', session],
    ] as const) {
      expect(source, label).toContain('Residual 981');
      expect(source, label).toContain("import { toIso } from './to-iso'");
      expect(source, label).not.toMatch(/function toIso\b/);
      expect(source, label).toContain('toIso(');
    }
  });

  it('maps epoch-ms to ISO and nullish to null', () => {
    expect(toIso(null)).toBeNull();
    expect(toIso(undefined)).toBeNull();
    expect(toIso(0)).toBe('1970-01-01T00:00:00.000Z');
    expect(toIso(1_700_000_000_000)).toBe(new Date(1_700_000_000_000).toISOString());
  });
});
