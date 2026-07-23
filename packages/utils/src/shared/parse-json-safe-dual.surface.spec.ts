import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseJson, parseJsonSafe } from './persistence';

/**
 * Residual 1025: notification parseJsonSafe dual retired onto utils persistence sole.
 * Soft residual 1038: tip focused suite numbers track Residual 1038 evidence tip (309/1339)
 *   until residual 1026 suite re-run.
 * Soft residual: account powersync private parseJson remains keep-boundary (throws on invalid).
 * Soft residual 1081: account PowerSync parseJson keep-boundary surface (no force-merge).
 * Soft residual 1091: api PowerSync parseJsonLikeString keep-boundary surface (no force-merge).
 * Does not flip §13.2 checkboxes.
 */
describe('parseJsonSafe dual retired (residual 1025)', () => {
  const sharedDir = __dirname;
  const sole = readFileSync(resolve(sharedDir, 'persistence.ts'), 'utf8');
  const index = readFileSync(resolve(sharedDir, 'index.ts'), 'utf8');
  const preference = readFileSync(
    resolve(
      sharedDir,
      '../../../notification/src/server/infrastructure/adapters/prisma/mappers/notification-preference-prisma.mapper.ts',
    ),
    'utf8',
  );
  const notification = readFileSync(
    resolve(
      sharedDir,
      '../../../notification/src/server/infrastructure/adapters/prisma/mappers/notification-prisma.mapper.ts',
    ),
    'utf8',
  );
  const template = readFileSync(
    resolve(
      sharedDir,
      '../../../notification/src/server/infrastructure/adapters/prisma/notification-template-prisma.repository.ts',
    ),
    'utf8',
  );
  const powersync = readFileSync(
    resolve(
      sharedDir,
      '../../../notification/src/server/infrastructure/adapters/powersync/notification-powersync.repository.ts',
    ),
    'utf8',
  );

  it('owns sole parseJsonSafe helper body and shared barrel export', () => {
    expect(sole).toContain('Residual 1025');
    expect(sole).toMatch(/export function parseJsonSafe\b/);
    expect(sole).toContain('parseJson(value, null)');
    expect(sole).toMatch(/export function parseJson\b/);
    expect(index).toContain("export * from './persistence'");
  });

  it('notification prisma mappers/repos import sole without local dual bodies', () => {
    for (const [label, source] of [
      ['preference-mapper', preference],
      ['notification-mapper', notification],
      ['template-repo', template],
    ] as const) {
      expect(source, label).toContain('Residual 1025');
      expect(source, label).toContain("import { parseJsonSafe } from '@dailyuse/utils/shared'");
      expect(source, label).not.toMatch(/function parseJsonSafe\b/);
      expect(source, label).toContain('parseJsonSafe');
    }
  });

  it('notification powersync repository imports sole without local parseJson dual body', () => {
    expect(powersync).toContain('Residual 1025');
    expect(powersync).toContain("import { parseJsonSafe } from '@dailyuse/utils/shared'");
    expect(powersync).not.toMatch(/function parseJson\b/);
    expect(powersync).not.toMatch(/function parseJsonSafe\b/);
    expect(powersync).toContain('parseJsonSafe');
  });

  it('returns null for empty/invalid JSON and parses valid payloads', () => {
    expect(parseJsonSafe(undefined)).toBeNull();
    expect(parseJsonSafe(null)).toBeNull();
    expect(parseJsonSafe('')).toBeNull();
    expect(parseJsonSafe('{')).toBeNull();
    expect(parseJsonSafe('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonSafe<string[]>('["x"]')).toEqual(['x']);
    // equivalent to parseJson(value, null)
    expect(parseJsonSafe('nope')).toBe(parseJson('nope', null));
  });
});
