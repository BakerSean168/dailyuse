import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractStructuredResultError, ResultErrorException } from './core';

/**
 * Residual 1162: contracts private isRecord keep-boundary (Result error shaping).
 * - contracts result/core: non-null object (arrays allowed) — private helper for extractStructuredResultError
 * - app-vue AI isRecord: plain-object only (!Array.isArray)
 * - desktop http-envelope-guards isRecord: non-null object (arrays allowed) — different package sole
 * Soft residual 1089: AI vs desktop isRecord keep-boundary remains separate.
 * Soft residual 951: AI local duals retired onto app-vue isRecord sole.
 * Does not flip §13.2 checkboxes.
 */
describe('contracts isRecord keep-boundary (residual 1162)', () => {
  const dir = __dirname;
  const core = readFileSync(resolve(dir, 'core.ts'), 'utf8');
  const aiSole = readFileSync(
    resolve(dir, '../../../app-vue/src/modules/ai/composables/isRecord.ts'),
    'utf8',
  );
  const desktopSole = readFileSync(
    resolve(dir, '../../../../apps/desktop/src/main/utils/http-envelope-guards.ts'),
    'utf8',
  );

  it('owns Residual 1162 keep-boundary markers on contracts private isRecord', () => {
    expect(core).toContain('Residual 1162 keep-boundary');
    expect(core).toMatch(/function isRecord\b/);
    expect(core).toContain("typeof value === 'object' && value !== null");
    expect(core).toContain('Soft residual 1162');
    // private — not exported from core module surface
    expect(core).not.toMatch(/export function isRecord\b/);
    const body = core.match(/function isRecord\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain("typeof value === 'object'");
    expect(body).not.toContain('!Array.isArray');
    expect(body).not.toContain('Boolean(value)');
  });

  it('differs from AI plain-object isRecord (no force-merge)', () => {
    expect(aiSole).toMatch(/export function isRecord\b/);
    expect(aiSole).toContain('!Array.isArray(value)');
    expect(aiSole).toContain('Residual 1089 keep-boundary');
    // contracts must not use AI plain-object reject-array body
    expect(core).not.toContain('!Array.isArray(value)');
    expect(core).not.toContain('Boolean(value)');
  });

  it('runtime: extractStructuredResultError accepts array-as-object edge via private isRecord shape', () => {
    // array is typeof object && !== null; but lacks code/message → null
    expect(extractStructuredResultError([])).toBeNull();
    // plain structured error object works
    expect(
      extractStructuredResultError({ code: 'X', message: 'y', statusCode: 400 }),
    ).toEqual({
      code: 'X',
      message: 'y',
      details: undefined,
      context: undefined,
      cause: undefined,
      statusCode: 400,
    });
    // ResultErrorException path
    const ex = new ResultErrorException('boom', 'E', undefined, { a: 1 }, 500);
    expect(extractStructuredResultError(ex)).toMatchObject({
      code: 'E',
      message: 'boom',
      statusCode: 500,
    });
    // desktop sole documents arrays-allowed body separately
    expect(desktopSole).toContain("value !== null && typeof value === 'object'");
    expect(desktopSole).not.toContain('!Array.isArray(value)');
  });

  it('documents residual 1162 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'is-record-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1162');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
