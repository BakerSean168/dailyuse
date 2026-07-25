/**
 * NotificationChannel Entity - Server Interface
 * 通知渠道实体 - 服务端接口
 *
 * Residual 861: NotificationChannelServerDTO dual body retired —
 * Server is Omit<Client, 'version' | 'updatedAt' | 'deletedAt'> (sync metadata is client-facing).
 */

import type { NotificationChannelClientDTO } from './notification-channel-client';

// Residual 861: Server dual retired — subset of Client without sync metadata fields.
export type NotificationChannelServerDTO = Omit<
  NotificationChannelClientDTO,
  'version' | 'updatedAt' | 'deletedAt'
>;
