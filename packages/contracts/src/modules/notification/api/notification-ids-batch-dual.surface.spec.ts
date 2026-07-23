import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 671: notification mark-read / batch-delete request dual bodies retired.
 * Both operations use NotificationIdsBatchSchema only.
 * Soft residual 799: BatchOperationResultDTO dual retired via NotificationBatchResultSchema
 * (see notification-batch-result-dual surface; not asserted here to avoid dual-surface lock drift).
 */
describe('notification ids batch request dual retired (residual 671)', () => {
  const apiDir = __dirname;
  const dto = readFileSync(resolve(apiDir, 'notification-batch.dto.ts'), 'utf8');
  const routes = readFileSync(
    resolve(apiDir, '../../../../../notification/src/api/routes.ts'),
    'utf8',
  );
  const controller = readFileSync(
    resolve(apiDir, '../../../../../notification/src/server/transport/notification.controller.ts'),
    'utf8',
  );

  it('exports a single shared notification id-batch schema', () => {
    expect(dto).toContain('Residual 671');
    expect(dto).toContain('export const NotificationIdsBatchSchema');
    expect(dto).toContain(
      'export type MarkAsReadBatchReq = z.infer<typeof NotificationIdsBatchSchema>',
    );
    expect(dto).toContain(
      'export type DeleteNotificationsBatchReq = z.infer<typeof NotificationIdsBatchSchema>',
    );
    expect(dto).not.toMatch(/export const MarkAsReadBatchSchema\b/);
    expect(dto).not.toMatch(/export const DeleteNotificationsBatchSchema\b/);
  });

  it('routes and controller parse the shared id-batch schema for both ops', () => {
    expect(routes).toContain('NotificationIdsBatchSchema');
    expect(routes).not.toContain('MarkAsReadBatchSchema');
    expect(routes).not.toContain('DeleteNotificationsBatchSchema');
    expect(controller).toContain('NotificationIdsBatchSchema');
    expect(controller).not.toContain('MarkAsReadBatchSchema');
    expect(controller).not.toContain('DeleteNotificationsBatchSchema');
    const routeHits =
      routes.split('schema: NotificationIdsBatchSchema').length - 1;
    expect(routeHits).toBeGreaterThanOrEqual(2);
    const parseHits =
      controller.split('NotificationIdsBatchSchema.safeParse').length - 1;
    expect(parseHits).toBeGreaterThanOrEqual(2);
  });
});
