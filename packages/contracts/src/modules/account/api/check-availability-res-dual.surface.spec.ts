import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 767: CheckAvailabilityRes dual body retired.
 * OpenAPI + transport use AvailabilityResponseSchema; Res is z.infer alias.
 */
describe('check availability res dual retired (residual 767)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'account-availability.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../account/src/api/routes.ts'),
    'utf8',
  );

  it('dto Res is z.infer alias without interface dual body', () => {
    expect(dto).toContain('Residual 767');
    expect(dto).toContain("from './response-schemas'");
    expect(dto).toContain(
      'export type CheckAvailabilityRes = z.infer<typeof AvailabilityResponseSchema>',
    );
    expect(dto).not.toMatch(/export interface CheckAvailabilityRes\b/);
  });

  it('response-schemas owns the sole availability object body', () => {
    expect(responseSchemas).toContain('Residual 767');
    expect(responseSchemas).toContain(
      'export const AvailabilityResponseSchema = z.object({',
    );
    expect(responseSchemas).toContain('available: z.boolean()');
    expect(responseSchemas).toContain('suggestion: z.string().optional()');
  });

  it('OpenAPI availability route uses shared response schema', () => {
    expect(routes).toContain('AvailabilityResponseSchema');
    expect(routes).toContain(
      "successResponse(AvailabilityResponseSchema, '检查成功')",
    );
  });
});
