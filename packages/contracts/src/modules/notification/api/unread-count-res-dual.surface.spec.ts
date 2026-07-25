import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 801: UnreadCountResponse dual body retired.
 * Sole UnreadCountResponseSchema + z.infer owned by contracts response-schemas.
 * Notification package port re-exports the contracts type (no local interface dual).
  *
 * Soft residual 829: NotificationPreferenceClientDTO dual retired via NotificationPreferenceResponseSchema
 * (see notification-preference-calendar-prefs-client-dto-dual surface).
 */
describe('notification unread count res dual retired (residual 801)', () => {
  const apiDir = __dirname;
  const responseSchemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');
  const port = readFileSync(
    resolve(
      apiDir,
      '../../../../../notification/src/application-client/ports/notification-api-client.port.ts',
    ),
    'utf8',
  );
  const routes = readFileSync(
    resolve(apiDir, '../../../../../notification/src/api/routes.ts'),
    'utf8',
  );

  it('owns UnreadCountResponse as z.infer of UnreadCountResponseSchema', () => {
    expect(responseSchemas).toContain('Residual 801');
    expect(responseSchemas).toContain(
      'export const UnreadCountResponseSchema = z.object({',
    );
    expect(responseSchemas).toContain(
      'export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>',
    );
    expect(responseSchemas).toContain('count: z.number()');
  });

  it('notification port re-exports contracts UnreadCountResponse without interface dual', () => {
    expect(port).toContain('Residual 801');
    expect(port).toContain('UnreadCountResponse');
    expect(port).toContain("from '@dailyuse/contracts/notification'");
    expect(port).toContain('export type { UnreadCountResponse }');
    expect(port).not.toMatch(/export interface UnreadCountResponse\b/);
  });

  it('OpenAPI routes use UnreadCountResponseSchema only', () => {
    expect(routes).toContain('UnreadCountResponseSchema');
    const hits = routes.split('UnreadCountResponseSchema').length - 1;
    expect(hits).toBeGreaterThanOrEqual(2);
  });
});
