/**
 * Notification DTO Converters
 *
 * Keep conversion logic minimal and aligned with current contracts module shapes.
 */

import type {
  NotificationServerDTO,
  NotificationClientDTO,
  NotificationPreferenceServerDTO,
  NotificationPreferenceClientDTO,
  NotificationChannelClientDTO,
} from '@dailyuse/contracts/notification';

export function toNotificationClientDTO(serverDTO: NotificationServerDTO): NotificationClientDTO {
  const notificationChannels: NotificationChannelClientDTO[] | null =
    serverDTO.notificationChannels?.map((channel) => ({
      id: channel.id,
      notificationId: channel.notificationId,
      channelType: channel.channelType,
      status: channel.status,
      recipient: channel.recipient,
      sendAttempts: channel.sendAttempts,
      maxRetries: channel.maxRetries,
      error: channel.error,
      response: channel.response,
      version: 1,
      createdAt: channel.createdAt,
      updatedAt: channel.createdAt,
      deletedAt: null,
      sentAt: channel.sentAt,
      failedAt: channel.failedAt,
    })) ?? null;

  return {
    id: serverDTO.id,
    identityId: serverDTO.identityId,
    title: serverDTO.title,
    content: serverDTO.content,
    type: serverDTO.type,
    category: serverDTO.category,
    importance: serverDTO.importance,
    isRead: serverDTO.isRead,
    readAt: serverDTO.readAt,
    status: serverDTO.status,
    actions: serverDTO.actions ?? null,
    metadata: serverDTO.metadata ?? null,
    version: serverDTO.version,
    createdAt: serverDTO.createdAt,
    updatedAt: serverDTO.updatedAt,
    deletedAt: serverDTO.deletedAt,
    notificationChannels,
  };
}

export function toNotificationPreferenceClientDTO(
  serverDTO: NotificationPreferenceServerDTO,
): NotificationPreferenceClientDTO {
  return {
    id: serverDTO.id,
    identityId: serverDTO.identityId,
    settings: serverDTO.settings,
    version: serverDTO.version,
    createdAt: serverDTO.createdAt,
    updatedAt: serverDTO.updatedAt,
    deletedAt: serverDTO.deletedAt,
  };
}
