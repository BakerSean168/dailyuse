import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 805: ProgressBreakdown dual body retired.
 * Sole ProgressBreakdownResSchema + z.infer (flat API success body).
 */
describe('progress breakdown res dual retired (residual 805)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const vo = readFileSync(resolve(apiDir, '../value-objects/progress-breakdown.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../goal/src/api/routes/goal.routes.ts'),
    'utf8',
  );

  it('owns ProgressBreakdown as z.infer of ProgressBreakdownResSchema', () => {
    expect(vo).toContain('Residual 805');
    expect(vo).toContain("from '../api/response-schemas'");
    expect(vo).toContain(
      'export type ProgressBreakdown = z.infer<typeof ProgressBreakdownResSchema>',
    );
    expect(vo).not.toMatch(/export interface ProgressBreakdown\b/);
  });

  it('ProgressBreakdownResSchema owns weighted-average contribution fields', () => {
    expect(responseSchemas).toContain('Residual 805');
    expect(responseSchemas).toContain(
      'export const ProgressBreakdownResSchema = z.object({',
    );
    expect(responseSchemas).toContain("calculationMode: z.literal('WeightedAverage')");
    expect(responseSchemas).toContain('krContributions: z.array(');
    expect(responseSchemas).toContain('totalProgress: z.number()');
    expect(responseSchemas).toContain('lastUpdateTime: z.number()');
    expect(responseSchemas).toContain('updateTrigger: z.string()');
  });

  it('OpenAPI goal routes use ProgressBreakdownResSchema only', () => {
    expect(routes).toContain('ProgressBreakdownResSchema');
    expect(routes).toContain("successResponse(ProgressBreakdownResSchema, '获取成功')");
  });
});
