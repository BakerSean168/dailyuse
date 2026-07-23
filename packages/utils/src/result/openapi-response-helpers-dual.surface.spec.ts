import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { errorResponse, successResponse } from './openapi-helpers';
import { z } from 'zod';

/**
 * Residual 1029: openapi successResponse/errorResponse dual retired onto utils sole.
 * apps/api openapi registry re-exports without local dual bodies.
 * Soft residual: api ErrorResponseSchema registration remains component catalog keep-boundary
 * (slightly narrower than OpenApiErrorResponseSchema.context).
 * Soft residual 1028: tip focused suite numbers track Residual 1028 evidence tip (304/1319).
 * Does not flip §13.2 checkboxes.
 */
describe('openapi response helpers dual retired (residual 1029)', () => {
  const sole = readFileSync(resolve(__dirname, 'openapi-helpers.ts'), 'utf8');
  const barrel = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');
  const apiRegistry = readFileSync(
    resolve(__dirname, '../../../../apps/api/src/shared/infrastructure/openapi/registry.ts'),
    'utf8',
  );

  it('owns sole successResponse and errorResponse helper bodies', () => {
    expect(sole).toContain('Residual 1029');
    expect(sole).toMatch(/export function successResponse\b/);
    expect(sole).toMatch(/export function errorResponse\b/);
    expect(sole).toContain('ok: z.literal(true)');
    expect(sole).toContain('OpenApiErrorResponseSchema');
  });

  it('result barrel re-exports helpers from openapi-helpers', () => {
    expect(barrel).toContain("from './openapi-helpers'");
    expect(barrel).toContain('successResponse');
    expect(barrel).toContain('errorResponse');
  });

  it('apps/api openapi registry re-exports sole without local dual bodies', () => {
    expect(apiRegistry).toContain('Residual 1029');
    expect(apiRegistry).toContain("from '@dailyuse/utils/result'");
    expect(apiRegistry).toContain('successResponse');
    expect(apiRegistry).toContain('errorResponse');
    expect(apiRegistry).not.toMatch(/export function successResponse\b/);
    expect(apiRegistry).not.toMatch(/export function errorResponse\b/);
    expect(apiRegistry).not.toMatch(/function successResponse\b/);
    expect(apiRegistry).not.toMatch(/function errorResponse\b/);
    // keep-boundary component registration still present
    expect(apiRegistry).toContain('ErrorResponseSchema');
  });

  it('builds success and error openapi response envelopes', () => {
    const success = successResponse(z.object({ id: z.string() }), 'ok');
    expect(success.description).toBe('ok');
    expect(success.content['application/json'].schema).toBeTruthy();

    const error = errorResponse('missing');
    expect(error.description).toBe('missing');
    expect(error.content['application/json'].schema).toBeTruthy();
  });
});
