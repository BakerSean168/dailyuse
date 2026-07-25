import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toDateString } from './projection-helpers';
import { toDate, toDateOrNull } from '@dailyuse/utils/shared';

/**
 * Residual 1123: toDate / toDateString cross-package keep-boundary.
 * - data-portability toDateString: unknown → string|undefined (Date/number→ISO; string passthrough)
 * - utils toDate: always Date; nullish/invalid → now
 * - utils toDateOrNull: nullish/invalid → null
 * - AI PowerSync conversation toDate: string|null|undefined → Date|null
 * Soft residual 1101: toTimestamp keep-boundary family remains separate.
 * Soft residual 981: auth toIso number→ISO|null remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('toDate/toDateString cross-package keep-boundary (residual 1123)', () => {
  const dir = __dirname;
  const helpers = readFileSync(resolve(dir, 'projection-helpers.ts'), 'utf8');
  const utilsPersistence = readFileSync(
    resolve(dir, '../../../../../../utils/src/shared/persistence.ts'),
    'utf8',
  );
  const aiMapper = readFileSync(
    resolve(
      dir,
      '../../../../../../ai/src/server/infrastructure/adapters/powersync/mappers/powersync-ai-conversation.mapper.ts',
    ),
    'utf8',
  );

  it('owns Residual 1123 keep-boundary markers on portable toDateString', () => {
    expect(helpers).toContain('Residual 1123 keep-boundary');
    expect(helpers).toMatch(/export function toDateString\b/);
    expect(helpers).toContain('value: unknown');
    expect(helpers).toContain('string | undefined');
    expect(helpers).toContain('value.toISOString()');
    expect(helpers).toContain("typeof value === 'string'");
    // must not invent now (empty new Date()) or declare Date return type
    expect(helpers).not.toMatch(/export function toDateString[\s\S]{0,250}return new Date\(\)/);
    expect(helpers).not.toMatch(/export function toDateString\([^)]*\):\s*Date\b/);
    expect(helpers).toContain('toISOString()');
  });

  it('differs from utils toDate always-Date+now and toDateOrNull (no force-merge)', () => {
    expect(utilsPersistence).toContain('Residual 1123 keep-boundary');
    expect(utilsPersistence).toContain('Soft residual 1123');
    expect(utilsPersistence).toMatch(/export function toDate\b/);
    expect(utilsPersistence).toMatch(/export function toDateOrNull\b/);
    expect(utilsPersistence).toContain('return new Date()');
    expect(utilsPersistence).toContain('Date | null');
    // soft residual may name toDateString; utils must not implement string ISO export dual
    expect(utilsPersistence).not.toMatch(/export function toDateString\b/);
    expect(utilsPersistence).not.toContain('value.toISOString()');
  });

  it('differs from AI PowerSync string→Date|null toDate (no force-merge)', () => {
    expect(aiMapper).toContain('Residual 1123 keep-boundary');
    expect(aiMapper).toContain('Soft residual 1123');
    expect(aiMapper).toMatch(/function toDate\b/);
    expect(aiMapper).toContain('string | null | undefined');
    expect(aiMapper).toContain('Date | null');
    expect(aiMapper).toContain('return null');
    // AI private must not always invent now or accept unknown
    expect(aiMapper).not.toMatch(/function toDate\(value: unknown\)/);
    expect(aiMapper).not.toMatch(/function toDate[\s\S]{0,200}return new Date\(\)/);
  });

  it('runtime: portable toDateString vs utils toDate/toDateOrNull shapes', () => {
    const iso = '2020-01-01T00:00:00.000Z';
    expect(toDateString(iso)).toBe(iso);
    expect(toDateString(new Date(iso))).toBe(iso);
    expect(toDateString(Date.parse(iso))).toBe(iso);
    expect(toDateString(null)).toBeUndefined();
    expect(toDateString(undefined)).toBeUndefined();
    expect(toDateString('')).toBeUndefined();
    expect(toDateString({})).toBeUndefined();

    expect(toDate(null)).toBeInstanceOf(Date);
    expect(toDate('not-a-date')).toBeInstanceOf(Date);
    expect(toDate(iso).toISOString()).toBe(iso);

    expect(toDateOrNull(null)).toBeNull();
    expect(toDateOrNull('not-a-date')).toBeNull();
    expect(toDateOrNull(iso)?.toISOString()).toBe(iso);
  });

  it('documents residual 1123 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'to-date-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1123');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
