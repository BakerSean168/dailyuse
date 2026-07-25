import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 845: NotificationTemplateServerDTO dual body retired.
 * Same NotificationTemplateResponseSchema + z.infer as Client (residual 839).
 * Full client+server single-track.
 */
describe('notification template server dto dual retired (residual 845)', () => {
  const apiDir = __dirname;
  const server = readFileSync(
    resolve(apiDir, '../aggregates/notification-template-server.ts'),
    'utf8',
  );
  const client = readFileSync(
    resolve(apiDir, '../aggregates/notification-template-client.ts'),
    'utf8',
  );
  const schemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('owns NotificationTemplateServerDTO as z.infer of NotificationTemplateResponseSchema', () => {
    expect(server).toContain('Residual 845');
    expect(server).toContain(
      'export type NotificationTemplateServerDTO = z.infer<typeof NotificationTemplateResponseSchema>',
    );
    expect(server).not.toMatch(/export interface NotificationTemplateServerDTO\b/);
    expect(schemas).toContain('Residual 845');
    expect(schemas).toContain(
      'export const NotificationTemplateResponseSchema = z.object({',
    );
  });

  it('client and server share the same ResponseSchema single-track', () => {
    expect(client).toContain(
      'export type NotificationTemplateClientDTO = z.infer<typeof NotificationTemplateResponseSchema>',
    );
    expect(server).toContain("from '../api/response-schemas'");
    expect(client).toContain("from '../api/response-schemas'");
  });

  it('server has no manual field dual body', () => {
    expect(server).not.toContain('TransferDate');
    expect(server).not.toContain('NotificationTemplateConfigServerDTO');
    expect(server).not.toContain('createdAt: TransferDate');
  });
});
