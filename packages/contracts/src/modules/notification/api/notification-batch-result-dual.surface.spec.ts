import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 799: BatchOperationResultDTO dual body retired.
 * Sole NotificationBatchResultSchema + z.infer (updatedCount/deletedCount optional).
 */
describe('notification batch result dual retired (residual 799)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, '../dtos/batch-result.dto.ts'), 'utf8');
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const batchDto = readFileSync(resolve(apiDir, 'notification-batch.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../notification/src/api/routes.ts'),
    'utf8',
  );

  it('owns BatchOperationResultDTO as z.infer of NotificationBatchResultSchema', () => {
    expect(dto).toContain('Residual 799');
    expect(dto).toContain("from '../api/response-schemas'");
    expect(dto).toContain(
      'export type BatchOperationResultDTO = z.infer<typeof NotificationBatchResultSchema>',
    );
    expect(dto).not.toMatch(/export interface BatchOperationResultDTO\b/);
  });

  it('NotificationBatchResultSchema is sole batch-result shape with optional counts', () => {
    expect(responseSchemas).toContain('Residual 799');
    expect(responseSchemas).toContain(
      'export const NotificationBatchResultSchema = z.object({',
    );
    expect(responseSchemas).toContain('updatedCount: z.number().optional()');
    expect(responseSchemas).toContain('deletedCount: z.number().optional()');
  });

  it('batch Res aliases and OpenAPI routes reuse the sole batch result shape', () => {
    expect(batchDto).toContain('Residual 799');
    expect(batchDto).toContain('export type MarkAsReadBatchRes = BatchOperationResultDTO');
    expect(batchDto).toContain('export type DeleteNotificationsBatchRes = BatchOperationResultDTO');
    expect(batchDto).toContain('export type CleanupOldNotificationsRes = BatchOperationResultDTO');
    expect(routes).toContain('NotificationBatchResultSchema');
    const hits = routes.split('NotificationBatchResultSchema').length - 1;
    expect(hits).toBeGreaterThanOrEqual(3);
  });
});
