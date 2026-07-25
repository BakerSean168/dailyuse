import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 288: NotificationClientPort is a type alias of INotificationApiClient
 * (no second interface dual body; dismissAll dual removed → batchDeleteNotifications).
 */
describe('notification client port dual single-track surface', () => {
  const service = readFileSync(resolve(__dirname, 'notification-client-service.ts'), 'utf8');
  const port = readFileSync(
    resolve(__dirname, 'ports/notification-api-client.port.ts'),
    'utf8',
  );

  it('defines INotificationApiClient once in ports', () => {
    expect(port).toContain('export interface INotificationApiClient');
    expect(port).toContain('batchDeleteNotifications');
    expect(port).not.toContain('dismissAll');
  });

  it('NotificationClientPort is type alias without dismissAll dual', () => {
    expect(service).toMatch(/export type NotificationClientPort\s*=\s*INotificationApiClient/);
    expect(service).not.toMatch(/export interface NotificationClientPort\s*\{/);
    expect(service).toContain('implements INotificationApiClient');
    expect(service).not.toMatch(/async dismissAll\s*\(/);
    expect(service).not.toMatch(/this\.dismissAll\s*=/);
  });
});
