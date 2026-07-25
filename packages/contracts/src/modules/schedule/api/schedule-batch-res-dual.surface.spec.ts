import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 717: schedule batch operation response dual body retired.
 * ScheduleBatchOperationResponseDTO reuses ScheduleBatchOperationResponseSchema only.
 */
describe('schedule batch response dual retired (residual 717)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'requests/schedule-task-requests.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../schedule/src/api/routes.ts'),
    'utf8',
  );

  it('exports ScheduleBatchOperationResponseSchema as sole batch response shape', () => {
    expect(responseSchemas).toContain('Residual 717');
    expect(responseSchemas).toContain(
      'export const ScheduleBatchOperationResponseSchema',
    );
  });

  it('semantic DTO is z.infer alias without interface dual body', () => {
    expect(dto).toContain('Residual 717');
    expect(dto).toContain(
      'export type ScheduleBatchOperationResponseDTO = z.infer<',
    );
    expect(dto).toContain('typeof ScheduleBatchOperationResponseSchema');
    expect(dto).not.toMatch(/export interface ScheduleBatchOperationResponseDTO\b/);
    expect(dto).not.toMatch(/export interface BatchOperationResponseDTO\b/);
  });

  it('OpenAPI schedule batch routes use ScheduleBatchOperationResponseSchema', () => {
    expect(routes).toContain('ScheduleBatchOperationResponseSchema');
    expect(routes).toContain(
      'successResponse(ScheduleBatchOperationResponseSchema',
    );
  });
});
