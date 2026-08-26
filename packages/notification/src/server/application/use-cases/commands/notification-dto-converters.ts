import type {
  NotificationServerDTO,
  NotificationClientDTO,
  NotificationPreferenceServerDTO,
  NotificationPreferenceClientDTO,
  NotificationChannelClientDTO,
} from '@memoflow/contracts/notification';

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
    ...serverDTO,
    notificationChannels,
  };
}

export function toNotificationPreferenceClientDTO(
  serverDTO: NotificationPreferenceServerDTO,
): NotificationPreferenceClientDTO {
  return {
    id: serverDTO.id,
    identityId: serverDTO.identityId,
    globalChannels: serverDTO.globalChannels,
    workflowOverrides: serverDTO.workflowOverrides,
    doNotDisturb: serverDTO.doNotDisturb ?? null,
    rateLimit: serverDTO.rateLimit ?? null,
    version: serverDTO.version,
    createdAt: serverDTO.createdAt,
    updatedAt: serverDTO.updatedAt,
    deletedAt: serverDTO.deletedAt,
  };
}
