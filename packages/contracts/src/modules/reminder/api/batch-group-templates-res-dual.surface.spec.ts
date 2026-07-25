import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 781: BatchGroupTemplatesRes dual body retired.
 * Reuses ReminderBatchResultSchema; unused errors field dropped (runtime never returns it).
 */
describe('batch group templates res dual retired (residual 781)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'reminder-group.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../reminder/src/api/routes/reminder-group.routes.ts'),
    'utf8',
  );

  it('dto Res reuses ReminderBatchResultSchema without interface dual body', () => {
    expect(dto).toContain('Residual 781');
    expect(dto).toContain(
      'export const BatchGroupTemplatesResSchema = ReminderBatchResultSchema',
    );
    expect(dto).toContain(
      'export type BatchGroupTemplatesRes = z.infer<typeof BatchGroupTemplatesResSchema>',
    );
    expect(dto).not.toMatch(/export interface BatchGroupTemplatesRes\b/);
    expect(dto).not.toContain('errors?: Array<{');
  });

  it('response-schemas owns sole batch result object body', () => {
    expect(responseSchemas).toContain('Residual 781');
    expect(responseSchemas).toContain(
      'export const ReminderBatchResultSchema = z.object({',
    );
    expect(responseSchemas).toContain('successCount: z.number()');
    expect(responseSchemas).toContain('failedCount: z.number()');
  });

  it('OpenAPI batch route uses ReminderBatchResultSchema', () => {
    expect(routes).toContain('ReminderBatchResultSchema');
    expect(routes).toContain(
      "successResponse(ReminderBatchResultSchema, '操作成功')",
    );
  });
});
