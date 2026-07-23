import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 839: NotificationTemplateClientDTO dual body retired.
 * Sole NotificationTemplateResponseSchema + z.infer.
 * NotificationTemplateServerDTO remains interface (identical shape; TransferDate timestamps).
 */
describe('notification template client dto dual retired (residual 839)', () => {
  const apiDir = __dirname;
  const client = readFileSync(
    resolve(apiDir, '../aggregates/notification-template-client.ts'),
    'utf8',
  );
  const server = readFileSync(
    resolve(apiDir, '../aggregates/notification-template-server.ts'),
    'utf8',
  );
  const schemas = readFileSync(resolve(apiDir, 'response-schemas.ts'), 'utf8');

  it('owns NotificationTemplateClientDTO as z.infer of NotificationTemplateResponseSchema', () => {
    expect(client).toContain('Residual 839');
    expect(client).toContain(
      'export type NotificationTemplateClientDTO = z.infer<typeof NotificationTemplateResponseSchema>',
    );
    expect(client).not.toMatch(/export interface NotificationTemplateClientDTO\b/);
    expect(schemas).toContain('Residual 839');
    expect(schemas).toContain(
      'export const NotificationTemplateResponseSchema = z.object({',
    );
    expect(schemas).toContain('isSystemTemplate: z.boolean()');
    expect(schemas).toContain('export const NotificationTemplateConfigSchema = z.object({');
  });

  it('keeps NotificationTemplateServerDTO as interface body', () => {
    expect(server).toMatch(/export interface NotificationTemplateServerDTO\b/);
    expect(server).toContain('Soft residual 839');
    expect(server).toContain('TransferDate');
    expect(server).not.toMatch(/export interface NotificationTemplateClientDTO\b/);
  });

  it('client imports response-schemas only (no manual field dual)', () => {
    expect(client).toContain("from '../api/response-schemas'");
    expect(client).not.toContain('NotificationTemplateConfigServerDTO');
    expect(client).not.toContain('createdAt: number');
  });
});
