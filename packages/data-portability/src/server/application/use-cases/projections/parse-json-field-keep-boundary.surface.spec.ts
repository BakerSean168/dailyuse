import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseJsonField } from './projection-helpers';

/**
 * Residual 1095: data-portability parseJsonField keep-boundary.
 * Portable projection mapping accepts unknown inputs: non-strings pass through;
 * null/undefined → fallback; catch → fallback ?? original value.
 * Intentionally not merged into:
 * - utils parseJson/parseJsonSafe (string|null|undefined + fixed fallback only)
 * - api PowerSync parseJsonLikeString (brace/bracket-looking only)
 * - account PowerSync private parseJson (required string, throws)
 * Soft residual 1091: api parseJsonLikeString keep-boundary remains.
 * Soft residual 1081: account PowerSync throw parseJson keep-boundary remains.
 * Soft residual 1099: asRecord/toRecord keep-boundary family (null vs {} vs undefined).
 * Does not flip §13.2 checkboxes.
 */
describe('data-portability parseJsonField keep-boundary (residual 1095)', () => {
  const dir = __dirname;
  const helpers = readFileSync(resolve(dir, 'projection-helpers.ts'), 'utf8');
  const utilsPersistence = readFileSync(
    resolve(dir, '../../../../../../utils/src/shared/persistence.ts'),
    'utf8',
  );
  const apiCrud = readFileSync(
    resolve(dir, '../../../../../../../apps/api/src/modules/powersync/crud-normalization.ts'),
    'utf8',
  );
  const accountMapper = readFileSync(
    resolve(
      dir,
      '../../../../../../account/src/server/infrastructure/adapters/powersync/mappers/account-powersync.mapper.ts',
    ),
    'utf8',
  );

  it('owns Residual 1095 keep-boundary markers on parseJsonField', () => {
    expect(helpers).toContain('Residual 1095 keep-boundary');
    expect(helpers).toMatch(/export function parseJsonField\b/);
    expect(helpers).toContain('value: unknown');
    expect(helpers).toContain('if (typeof value !== \'string\') return value');
    expect(helpers).toContain('return fallback ?? value');
    expect(helpers).toContain('JSON.parse(value)');
    // must not import utils parsers
    expect(helpers).not.toContain('@dailyuse/utils');
    expect(helpers).not.toMatch(/import\s*\{[^}]*parseJsonSafe[^}]*\}/);
    expect(helpers).not.toMatch(/import\s*\{[^}]*\bparseJson\b[^}]*\}/);
  });

  it('differs from utils parseJson/parseJsonSafe sole shape (no force-merge)', () => {
    expect(utilsPersistence).toMatch(/export function parseJson\b/);
    expect(utilsPersistence).toMatch(/export function parseJsonSafe\b/);
    expect(utilsPersistence).toContain('Soft residual 1095');
    expect(utilsPersistence).toContain('value: string | null | undefined');
    expect(utilsPersistence).toContain('if (!value) return fallback');
    // Soft residual may name keep-boundary; sole must not implement unknown passthrough
    expect(utilsPersistence).not.toMatch(/export function parseJsonField\b/);
    expect(utilsPersistence).not.toContain("typeof value !== 'string'");
    expect(utilsPersistence).not.toContain('fallback ?? value');
  });

  it('differs from api parseJsonLikeString and account throw parseJson (no force-merge)', () => {
    expect(apiCrud).toContain('Residual 1091 keep-boundary');
    expect(apiCrud).toContain('Soft residual 1095');
    expect(apiCrud).toMatch(/function parseJsonLikeString\b/);
    expect(apiCrud).not.toMatch(/function parseJsonField\b/);
    expect(accountMapper).toContain('Residual 1081 keep-boundary');
    expect(accountMapper).toContain('Soft residual 1095');
    expect(accountMapper).toMatch(/private static parseJson\b/);
    expect(accountMapper).not.toMatch(/function parseJsonField\b/);
  });

  it('runtime: non-string passthrough, fallback, and catch keeps original without fallback', () => {
    expect(parseJsonField({ a: 1 })).toEqual({ a: 1 });
    expect(parseJsonField(null, { x: 1 })).toEqual({ x: 1 });
    expect(parseJsonField(undefined)).toBeUndefined();
    expect(parseJsonField('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonField('[invalid]')).toBe('[invalid]');
    expect(parseJsonField('[invalid]', [])).toEqual([]);
    expect(parseJsonField('plain')).toBe('plain');
  });

  it('documents residual 1095 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'parse-json-field-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1095');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
