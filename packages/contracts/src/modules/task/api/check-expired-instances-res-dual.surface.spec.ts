import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 697: task check-expired instances response dual body retired.
 * CheckExpiredTaskInstancesRes reuses CheckExpiredTaskInstancesResponseSchema only.
 */
describe('task check-expired instances res dual retired (residual 697)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const dto = readFileSync(resolve(apiDir, 'task-instance.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../task/src/api/routes/task-instance.routes.ts'),
    'utf8',
  );

  it('exports CheckExpiredTaskInstancesResponseSchema with instance array', () => {
    expect(responseSchemas).toContain('Residual 697');
    expect(responseSchemas).toContain('export const CheckExpiredTaskInstancesResponseSchema');
    expect(responseSchemas).toContain('instances: z.array(TaskInstanceResponseSchema)');
  });

  it('semantic Res type is z.infer alias without interface dual body', () => {
    expect(dto).toContain('Residual 697');
    expect(dto).toContain(
      'export type CheckExpiredTaskInstancesRes = z.infer<typeof CheckExpiredTaskInstancesResponseSchema>',
    );
    expect(dto).not.toMatch(/export interface CheckExpiredTaskInstancesRes\b/);
  });

  it('OpenAPI task instance route uses CheckExpiredTaskInstancesResponseSchema only', () => {
    expect(routes).toContain('CheckExpiredTaskInstancesResponseSchema');
    expect(routes).toContain('successResponse(CheckExpiredTaskInstancesResponseSchema');
  });
});
