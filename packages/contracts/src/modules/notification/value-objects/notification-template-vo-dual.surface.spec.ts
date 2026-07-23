import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 659: retire dead notification template VO dual and snooze dual.
 * Live template contracts: NotificationTemplateConfigServerDTO + aggregate DTOs.
 */
describe('notification template VO dual single-track surface (residual 659)', () => {
  const vos = __dirname;
  const aggregates = resolve(vos, '../aggregates');

  it('drops notification-template VO dual and snooze-session dual files', () => {
    const index = readFileSync(resolve(vos, 'index.ts'), 'utf8');
    expect(existsSync(resolve(vos, 'notification-template.ts'))).toBe(false);
    expect(existsSync(resolve(vos, 'snooze-session.ts'))).toBe(false);
    expect(index).toMatch(/Residual 659/);
    expect(index).not.toMatch(/from '\.\/notification-template'/);
    expect(index).not.toMatch(/from '\.\/snooze-session'/);
    expect(index).not.toMatch(/export type \{[^}]*NotificationTemplateDTO/);
    expect(index).not.toMatch(/export type \{[^}]*SnoozeSessionDTO/);
  });

  it('keeps template config VO and aggregate client/server DTOs', () => {
    const index = readFileSync(resolve(vos, 'index.ts'), 'utf8');
    const config = readFileSync(resolve(vos, 'notification-template-config.ts'), 'utf8');
    const client = readFileSync(resolve(aggregates, 'notification-template-client.ts'), 'utf8');
    const server = readFileSync(resolve(aggregates, 'notification-template-server.ts'), 'utf8');
    expect(index).toContain('NotificationTemplateConfigServerDTO');
    expect(config).toContain('export interface NotificationTemplateConfigServerDTO');
    expect(client).toContain('export interface NotificationTemplateClientDTO');
    expect(server).toContain('export interface NotificationTemplateServerDTO');
  });
});
