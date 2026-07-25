import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 861: near-exact Client/Server dual bodies retired via Omit (not forced type X = Y).
 * ReminderResponseClientDTO = Omit<Server, 'identityId'>.
 * NotificationChannelServerDTO = Omit<Client, 'version' | 'updatedAt' | 'deletedAt'>.
 * Residual 863 (soft): NotificationClientDTO dual also retired via nested-channel Omit
 *   (notification-client-dto-dual.surface.spec.ts); this file keeps Residual 861 only.
 * DomainDate≠TransferDate duals remain separate (residual 859).
 */
describe('reminder/notification response channel subset duals retired (residual 861)', () => {
  const reminderEntity = __dirname;
  const notificationEntity = resolve(reminderEntity, '../../notification/entities');

  const response = readFileSync(resolve(reminderEntity, 'reminder-response-server.ts'), 'utf8');
  const channelServer = readFileSync(
    resolve(notificationEntity, 'notification-channel-server.ts'),
    'utf8',
  );
  const channelClient = readFileSync(
    resolve(notificationEntity, 'notification-channel-client.ts'),
    'utf8',
  );
  const reminderIndex = readFileSync(resolve(reminderEntity, 'index.ts'), 'utf8');
  const notificationIndex = readFileSync(resolve(notificationEntity, 'index.ts'), 'utf8');

  it('owns ReminderResponseClientDTO as Omit of Server without identityId', () => {
    expect(response).toContain('Residual 861');
    expect(response).toMatch(/export interface ReminderResponseServerDTO\b/);
    expect(response).toContain(
      "export type ReminderResponseClientDTO = Omit<ReminderResponseServerDTO, 'identityId'>",
    );
    expect(response).not.toMatch(/export interface ReminderResponseClientDTO\b/);
  });

  it('owns NotificationChannelServerDTO as Omit of Client without sync metadata', () => {
    expect(channelServer).toContain('Residual 861');
    expect(channelClient).toMatch(/export interface NotificationChannelClientDTO\b/);
    expect(channelServer).toContain(
      'export type NotificationChannelServerDTO = Omit<',
    );
    expect(channelServer).toContain("NotificationChannelClientDTO");
    expect(channelServer).toContain("'version' | 'updatedAt' | 'deletedAt'");
    expect(channelServer).not.toMatch(/export interface NotificationChannelServerDTO\b/);
  });

  it('barrels still export Client/Server names for both pairs', () => {
    for (const name of [
      'ReminderResponseServerDTO',
      'ReminderResponseClientDTO',
      'ReminderResponseAction',
    ]) {
      expect(reminderIndex).toContain(name);
    }
    for (const name of [
      'NotificationChannelServerDTO',
      'NotificationChannelClientDTO',
    ]) {
      expect(notificationIndex).toContain(name);
    }
  });
});
