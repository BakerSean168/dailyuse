import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 863: NotificationClientDTO dual body retired.
 * Client = Omit<Server, 'notificationChannels'> & { notificationChannels?: ClientChannel[] }.
 * Nested channel duals already residual 861 (Server = Omit Client sync metadata).
 */
describe('notification client dto dual retired (residual 863)', () => {
  const aggDir = __dirname;
  const client = readFileSync(resolve(aggDir, 'notification-client.ts'), 'utf8');
  const server = readFileSync(resolve(aggDir, 'notification-server.ts'), 'utf8');
  const index = readFileSync(resolve(aggDir, 'index.ts'), 'utf8');
  const channelServer = readFileSync(
    resolve(aggDir, '../entities/notification-channel-server.ts'),
    'utf8',
  );

  it('owns NotificationClientDTO as Omit of Server with client channel list', () => {
    expect(client).toContain('Residual 863');
    expect(client).toContain("export type NotificationClientDTO = Omit<NotificationServerDTO, 'notificationChannels'> & {");
    expect(client).toContain('notificationChannels?: NotificationChannelClientDTO[] | null');
    expect(client).not.toMatch(/export interface NotificationClientDTO\b/);
  });

  it('keeps sole NotificationServerDTO interface; channel dual remains residual 861 Omit', () => {
    expect(server).toMatch(/export interface NotificationServerDTO\b/);
    expect(server).toContain('Residual 863');
    expect(server).not.toMatch(/export type NotificationServerDTO\s*=/);
    expect(channelServer).toContain('Residual 861');
    expect(channelServer).toContain(
      'export type NotificationChannelServerDTO = Omit<',
    );
  });

  it('aggregate barrel still exports Client and Server DTO names', () => {
    expect(index).toContain('NotificationClientDTO');
    expect(index).toContain('NotificationServerDTO');
    expect(index).toContain("from './notification-client'");
    expect(index).toContain("from './notification-server'");
  });
});
