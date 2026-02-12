/**
 * Notification DTO Converters
 *
 * 共享的 DTO 转换函数
 */

import type {
  NotificationServerDTO,
  NotificationClientDTO,
  NotificationPreferenceServerDTO,
  NotificationPreferenceClientDTO,
  NotificationChannelServerDTO,
  NotificationChannelClientDTO,
  NotificationHistoryServerDTO,
  NotificationHistoryClientDTO,
  NotificationActionServerDTO,
  NotificationActionClientDTO,
  NotificationMetadataServerDTO,
  NotificationMetadataClientDTO,
  ChannelErrorServerDTO,
  ChannelErrorClientDTO,
  ChannelResponseServerDTO,
  ChannelResponseClientDTO,
  CategoryPreferenceServerDTO,
  CategoryPreferenceClientDTO,
  DoNotDisturbConfigServerDTO,
  DoNotDisturbConfigClientDTO,
  RateLimitServerDTO,
  RateLimitClientDTO,
} from '@dailyuse/contracts/notification';

export function toRateLimitClientDTO(serverDTO: RateLimitServerDTO): RateLimitClientDTO {
  return {
    ...serverDTO,
    limitText: `${serverDTO.maxPerHour}/hour, ${serverDTO.maxPerDay}/day`,
  };
}

export function toDoNotDisturbConfigClientDTO(
  serverDTO: DoNotDisturbConfigServerDTO,
): DoNotDisturbConfigClientDTO {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = serverDTO.startTime.split(':').map(Number);
  const startTimeMinutes = startHour * 60 + startMinute;

  const [endHour, endMinute] = serverDTO.endTime.split(':').map(Number);
  const endTimeMinutes = endHour * 60 + endMinute;

  const isActive =
    serverDTO.enabled &&
    serverDTO.daysOfWeek.includes(dayOfWeek) &&
    currentTime >= startTimeMinutes &&
    currentTime <= endTimeMinutes;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysOfWeekText = serverDTO.daysOfWeek.map((d) => days[d]).join(', ');

  return {
    ...serverDTO,
    timeRangeText: `${serverDTO.startTime} - ${serverDTO.endTime}`,
    daysOfWeekText,
    isActive,
  };
}

export function toCategoryPreferenceClientDTO(
  serverDTO: CategoryPreferenceServerDTO,
): CategoryPreferenceClientDTO {
  const enabledChannelsList = Object.entries(serverDTO.channels)
    .filter(([, enabled]) => enabled)
    .map(([channel]) => channel);

  return {
    ...serverDTO,
    enabledChannelsCount: enabledChannelsList.length,
    enabledChannelsList,
    importanceText: serverDTO.importance.join(', '),
  };
}

export function toChannelResponseClientDTO(serverDTO: ChannelResponseServerDTO): ChannelResponseClientDTO {
  const isSuccess =
    !!serverDTO.statusCode && serverDTO.statusCode >= 200 && serverDTO.statusCode < 300;
  return {
    ...serverDTO,
    isSuccess,
    statusText: isSuccess ? 'Success' : 'Failed',
  };
}

export function toChannelErrorClientDTO(serverDTO: ChannelErrorServerDTO): ChannelErrorClientDTO {
  return {
    ...serverDTO,
    displayMessage: serverDTO.message,
    isRetryable: false,
  };
}

export function toNotificationMetadataClientDTO(
  serverDTO: NotificationMetadataServerDTO,
): NotificationMetadataClientDTO {
  return {
    ...serverDTO,
    hasIcon: !!serverDTO.icon,
    hasImage: !!serverDTO.image,
    hasBadge: !!serverDTO.badge,
  };
}

export function toNotificationActionClientDTO(
  serverDTO: NotificationActionServerDTO,
): NotificationActionClientDTO {
  return {
    ...serverDTO,
    typeText: serverDTO.type,
    icon: '',
  };
}

export function toNotificationChannelClientDTO(
  serverDTO: NotificationChannelServerDTO,
): NotificationChannelClientDTO {
  return {
    ...serverDTO,
    isPending: serverDTO.status === 'PENDING',
    isSent: serverDTO.status === 'SENT',
    isDelivered: serverDTO.status === 'DELIVERED',
    isFailed: serverDTO.status === 'FAILED',
    statusText: serverDTO.status,
    channelTypeText: serverDTO.channelType,
    canRetry: serverDTO.status === 'FAILED' && serverDTO.sendAttempts < serverDTO.maxRetries,
    formattedCreatedAt: new Date(serverDTO.createdAt).toISOString(),
    formattedSentAt: serverDTO.sentAt ? new Date(serverDTO.sentAt).toISOString() : undefined,
    formattedDeliveredAt: serverDTO.deliveredAt
      ? new Date(serverDTO.deliveredAt).toISOString()
      : undefined,
    error: serverDTO.error ? toChannelErrorClientDTO(serverDTO.error) : null,
    response: serverDTO.response ? toChannelResponseClientDTO(serverDTO.response) : null,
  };
}

export function toNotificationHistoryClientDTO(
  serverDTO: NotificationHistoryServerDTO,
): NotificationHistoryClientDTO {
  return {
    ...serverDTO,
    actionText: serverDTO.action,
    timeAgo: '',
    formattedCreatedAt: new Date(serverDTO.createdAt).toISOString(),
  };
}

export function toNotificationClientDTO(serverDTO: NotificationServerDTO): NotificationClientDTO {
  const isDeleted = !!serverDTO.deletedAt;
  const isExpired = serverDTO.expiresAt ? serverDTO.expiresAt < Date.now() : false;

  return {
    ...serverDTO,
    isDeleted,
    isExpired,
    isPending: serverDTO.status === 'PENDING',
    isSent: serverDTO.status === 'SENT',
    isDelivered: serverDTO.status === 'DELIVERED',
    statusText: serverDTO.status,
    typeText: serverDTO.type,
    categoryText: serverDTO.category,
    importanceText: serverDTO.importance,
    urgencyText: serverDTO.urgency,
    timeAgo: '',
    formattedCreatedAt: new Date(serverDTO.createdAt).toISOString(),
    formattedUpdatedAt: new Date(serverDTO.updatedAt).toISOString(),
    formattedSentAt: serverDTO.sentAt ? new Date(serverDTO.sentAt).toISOString() : undefined,
    metadata: serverDTO.metadata ? toNotificationMetadataClientDTO(serverDTO.metadata) : null,
    actions: serverDTO.actions ? serverDTO.actions.map(toNotificationActionClientDTO) : null,
    channels: serverDTO.channels ? serverDTO.channels.map(toNotificationChannelClientDTO) : null,
    history: serverDTO.history ? serverDTO.history.map(toNotificationHistoryClientDTO) : null,
  };
}

export function toNotificationPreferenceClientDTO(
  serverDTO: NotificationPreferenceServerDTO,
): NotificationPreferenceClientDTO {
  const { doNotDisturb, categories, channels, rateLimit } = serverDTO;

  const clientCategories = {
    task: toCategoryPreferenceClientDTO(categories.task),
    goal: toCategoryPreferenceClientDTO(categories.goal),
    schedule: toCategoryPreferenceClientDTO(categories.schedule),
    reminder: toCategoryPreferenceClientDTO(categories.reminder),
    account: toCategoryPreferenceClientDTO(categories.account),
    system: toCategoryPreferenceClientDTO(categories.system),
  };

  const isAllEnabled = Object.values(clientCategories).every((cat) =>
    Object.values(cat.channels).every((channel) => channel),
  );
  const isAllDisabled = Object.values(clientCategories).every(
    (cat) => !Object.values(cat.channels).some((channel) => channel),
  );

  const now = new Date();
  const isInDoNotDisturbPeriod =
    !!doNotDisturb && doNotDisturb.enabled && doNotDisturb.startTime && doNotDisturb.endTime
      ? now >= new Date(doNotDisturb.startTime) && now <= new Date(doNotDisturb.endTime)
      : false;

  const enabledChannelsCount = Object.values(channels).filter(Boolean).length;

  return {
    ...serverDTO,
    doNotDisturb: doNotDisturb ? toDoNotDisturbConfigClientDTO(doNotDisturb) : null,
    rateLimit: rateLimit ? toRateLimitClientDTO(rateLimit) : null,
    categories: clientCategories,
    isAllEnabled,
    isAllDisabled,
    hasDoNotDisturb: !!doNotDisturb && doNotDisturb.enabled,
    isInDoNotDisturbPeriod,
    enabledChannelsCount,
    formattedCreatedAt: new Date(serverDTO.createdAt).toISOString(),
    formattedUpdatedAt: new Date(serverDTO.updatedAt).toISOString(),
  };
}
