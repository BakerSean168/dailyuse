import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractStructuredResultError, ResultErrorException } from './core';

/** Result error shaping keeps a package-private object guard; AI no longer owns a duplicate. */
describe('contracts structured-result object guard', () => {
  const dir = __dirname;
  const core = readFileSync(resolve(dir, 'core.ts'), 'utf8');
  const desktop = readFileSync(
    resolve(dir, '../../../../apps/desktop/src/main/utils/http-envelope-guards.ts'),
    'utf8',
  );

  it('keeps the contracts helper private and scoped to structured errors', () => {
    expect(core).toMatch(/function isRecord\b/);
    expect(core).not.toMatch(/export function isRecord\b/);
    expect(extractStructuredResultError([])).toBeNull();
    expect(extractStructuredResultError({ code: 'X', message: 'y', statusCode: 400 })).toEqual({
      code: 'X',
      message: 'y',
      details: undefined,
      context: undefined,
      cause: undefined,
      statusCode: 400,
    });
    const error = new ResultErrorException('boom', 'E', undefined, { a: 1 }, 500);
    expect(extractStructuredResultError(error)).toMatchObject({ code: 'E', message: 'boom', statusCode: 500 });
  });

  it('does not require a presentation-layer AI object-guard duplicate', () => {
    expect(desktop).toContain("value !== null && typeof value === 'object'");
    expect(() =>
      readFileSync(resolve(dir, '../../../app-vue/src/modules/ai/composables/isRecord.ts'), 'utf8'),
    ).toThrow();
  });
});
