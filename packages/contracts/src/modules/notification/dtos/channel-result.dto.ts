/**
 * Notification Channel Result DTO
 */

import type { NotificationChannelServerDTO } from '../entities/notification-channel-server';
import type { NotificationChannelType } from '../value-objects';

export interface SendNotificationResultDTO {
  channelsUsed: NotificationChannelType[];
}

export interface ListNotificationChannelsResultDTO {
  channels: NotificationChannelServerDTO[];
  total: number;
}
