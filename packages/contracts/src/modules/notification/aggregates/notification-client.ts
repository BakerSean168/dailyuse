/**
 * Notification Aggregate Root - Client Interface
 * 通知聚合根 - 客户端接口
 *
 * Residual 863: NotificationClientDTO dual body retired —
 * same shape as NotificationServerDTO except nested channel DTO kind
 * (Client channels vs residual 861 Server channel Omit subset).
 */

import type { NotificationServerDTO } from './notification-server';
import type { NotificationChannelClientDTO } from '../entities/notification-channel-client';

// Residual 863: Client dual retired — Server body + client-facing channel list.
export type NotificationClientDTO = Omit<NotificationServerDTO, 'notificationChannels'> & {
  notificationChannels?: NotificationChannelClientDTO[] | null;
};
