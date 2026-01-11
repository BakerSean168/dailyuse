/**
 * Notification Application Service
 *
 * 通知应用服务 - 处理通知的业务逻辑
 *
 * 注意：此服务仅包含纯应用层逻辑。
 * SSE 推送等基础设施相关代码应在 API 层实现。
 */

import {
  NotificationDomainService,
  NotificationPreferenceDomainService,
} from '@dailyuse/domain-server/notification';
import type {
  INotificationRepository,
  INotificationTemplateRepository,
  INotificationPreferenceRepository,
} from '@dailyuse/domain-server/notification';
import type {
  NotificationServerDTO,
  NotificationPreferenceServerDTO,
  NotificationClientDTO,
  NotificationPreferenceClientDTO,
  NotificationChannelClientDTO,
  NotificationHistoryClientDTO,
  NotificationMetadataClientDTO,
  NotificationActionClientDTO,
  CategoryPreferenceClientDTO,
  DoNotDisturbConfigClientDTO,
  RateLimitClientDTO,
  ChannelResponseClientDTO,
  ChannelErrorClientDTO,
  NotificationCategory,
  NotificationType,
  RelatedEntityType,
  CategoryPreferenceServerDTO,
  DoNotDisturbConfigServerDTO,
  RateLimitServerDTO,
  NotificationChannelServerDTO,
  NotificationHistoryServerDTO,
  NotificationMetadataServerDTO,
  NotificationActionServerDTO,
  ChannelResponseServerDTO,
  ChannelErrorServerDTO,
  CreateNotificationRequest,
} from '@dailyuse/contracts/notification';
import { NotificationChannelType } from '@dailyuse/contracts/notification';
import { NotificationContainer } from '@dailyuse/infrastructure-server';

// =================================================================
// DTO Converters
// =================================================================

function toRateLimitClientDTO(serverDTO: RateLimitServerDTO): RateLimitClientDTO {
  return {
    ...serverDTO,
    limitText: `${serverDTO.maxPerHour}/hour, ${serverDTO.maxPerDay}/day`,
  };
}

function toDoNotDisturbConfigClientDTO(
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

function toCategoryPreferenceClientDTO(
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

function toChannelResponseClientDTO(serverDTO: ChannelResponseServerDTO): ChannelResponseClientDTO {
  const isSuccess =
    !!serverDTO.statusCode && serverDTO.statusCode >= 200 && serverDTO.statusCode < 300;
  return {
    ...serverDTO,
    isSuccess,
    statusText: isSuccess ? 'Success' : 'Failed',
  };
}

function toChannelErrorClientDTO(serverDTO: ChannelErrorServerDTO): ChannelErrorClientDTO {
  return {
    ...serverDTO,
    displayMessage: serverDTO.message,
    isRetryable: false,
  };
}

function toNotificationMetadataClientDTO(
  serverDTO: NotificationMetadataServerDTO,
): NotificationMetadataClientDTO {
  return {
    ...serverDTO,
    hasIcon: !!serverDTO.icon,
    hasImage: !!serverDTO.image,
    hasBadge: !!serverDTO.badge,
  };
}

function toNotificationActionClientDTO(
  serverDTO: NotificationActionServerDTO,
): NotificationActionClientDTO {
  return {
    ...serverDTO,
    typeText: serverDTO.type,
    icon: '',
  };
}

function toNotificationChannelClientDTO(
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

function toNotificationHistoryClientDTO(
  serverDTO: NotificationHistoryServerDTO,
): NotificationHistoryClientDTO {
  return {
    ...serverDTO,
    actionText: serverDTO.action,
    timeAgo: '',
    formattedCreatedAt: new Date(serverDTO.createdAt).toISOString(),
  };
}

function toNotificationClientDTO(serverDTO: NotificationServerDTO): NotificationClientDTO {
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

function toNotificationPreferenceClientDTO(
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

/**
 * Notification Service
 */
export class NotificationService {
  private static instance: NotificationService;
  private domainService: NotificationDomainService;
  private preferenceService: NotificationPreferenceDomainService;

  private constructor(
    notificationRepository: INotificationRepository,
    templateRepository: INotificationTemplateRepository,
    preferenceRepository: INotificationPreferenceRepository,
  ) {
    this.preferenceService = new NotificationPreferenceDomainService(preferenceRepository);
    this.domainService = new NotificationDomainService(
      notificationRepository,
      templateRepository,
      preferenceRepository,
    );
  }

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(
    notificationRepository?: INotificationRepository,
    templateRepository?: INotificationTemplateRepository,
    preferenceRepository?: INotificationPreferenceRepository,
  ): NotificationService {
    const container = NotificationContainer.getInstance();
    const notificationRepo = notificationRepository || container.getNotificationRepository();
    const templateRepo = templateRepository || container.getTemplateRepository();
    const preferenceRepo = preferenceRepository || container.getPreferenceRepository();

    NotificationService.instance = new NotificationService(
      notificationRepo,
      templateRepo,
      preferenceRepo,
    );
    return NotificationService.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = NotificationService.createInstance();
    }
    return NotificationService.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    NotificationService.instance =
      undefined as unknown as NotificationService;
  }

  // ===== 通知操作 =====

  async createNotification(params: CreateNotificationRequest): Promise<NotificationClientDTO> {
    const notification = await this.domainService.createAndSendNotification(params);
    return toNotificationClientDTO(notification.toServerDTO());
  }

  async createNotificationFromTemplate(params: {
    accountUuid: string;
    templateUuid: string;
    variables: Record<string, any>;
    relatedEntityType?: RelatedEntityType;
    relatedEntityUuid?: string;
    channels?: NotificationChannelType[];
  }): Promise<NotificationClientDTO> {
    const notification = await this.domainService.createNotificationFromTemplate(params);
    return toNotificationClientDTO(notification.toServerDTO());
  }

  async sendBulkNotifications(
    notificationsData: CreateNotificationRequest[],
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.sendBulkNotifications(notificationsData);
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async getNotification(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<NotificationClientDTO | null> {
    const notification = await this.domainService.getNotification(uuid, options);
    return notification ? toNotificationClientDTO(notification.toServerDTO()) : null;
  }

  async getUserNotifications(
    accountUuid: string,
    options?: { includeRead?: boolean; limit?: number; offset?: number },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getUserNotifications(accountUuid, options);
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async getUnreadNotifications(
    accountUuid: string,
    options?: { limit?: number },
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getUnreadNotifications(accountUuid, options);
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async getUnreadCount(accountUuid: string): Promise<number> {
    return this.domainService.getUnreadCount(accountUuid);
  }

  async getCategoryStats(accountUuid: string): Promise<Record<NotificationCategory, number>> {
    return this.domainService.getCategoryStats(accountUuid);
  }

  async markAsRead(uuid: string): Promise<void> {
    await this.domainService.markAsRead(uuid);
  }

  async markManyAsRead(uuids: string[]): Promise<void> {
    await this.domainService.markManyAsRead(uuids);
  }

  async markAllAsRead(accountUuid: string): Promise<void> {
    await this.domainService.markAllAsRead(accountUuid);
  }

  async deleteNotification(uuid: string, soft = true): Promise<void> {
    await this.domainService.deleteNotification(uuid, soft);
  }

  async deleteManyNotifications(uuids: string[], soft = true): Promise<void> {
    await this.domainService.deleteManyNotifications(uuids, soft);
  }

  async executeNotificationAction(notificationUuid: string, actionId: string): Promise<void> {
    await this.domainService.executeNotificationAction(notificationUuid, actionId);
  }

  async getNotificationsByRelatedEntity(
    relatedEntityType: string,
    relatedEntityUuid: string,
  ): Promise<NotificationClientDTO[]> {
    const notifications = await this.domainService.getNotificationsByRelatedEntity(
      relatedEntityType,
      relatedEntityUuid,
    );
    return notifications.map((n) => toNotificationClientDTO(n.toServerDTO()));
  }

  async cleanupExpiredNotifications(): Promise<number> {
    return this.domainService.cleanupExpiredNotifications();
  }

  async cleanupDeletedNotifications(daysAgo = 30): Promise<number> {
    return this.domainService.cleanupDeletedNotifications(daysAgo);
  }

  // ===== 偏好设置 =====

  async getPreference(accountUuid: string): Promise<NotificationPreferenceClientDTO | null> {
    const preference = await this.preferenceService.getPreference(accountUuid);
    return preference ? toNotificationPreferenceClientDTO(preference.toServerDTO()) : null;
  }

  async getOrCreatePreference(accountUuid: string): Promise<NotificationPreferenceClientDTO> {
    const preference = await this.preferenceService.getOrCreatePreference(accountUuid);
    return toNotificationPreferenceClientDTO(preference.toServerDTO());
  }

  async updatePreference(
    accountUuid: string,
    updates: Partial<{
      channelPreferences: {
        inApp?: boolean;
        push?: boolean;
        email?: boolean;
        sms?: boolean;
      };
      categoryPreferences: Record<NotificationCategory, Partial<CategoryPreferenceServerDTO>>;
      doNotDisturbConfig: Partial<DoNotDisturbConfigServerDTO>;
    }>,
  ): Promise<NotificationPreferenceClientDTO> {
    if (updates.channelPreferences) {
      await this.preferenceService.updateChannels(accountUuid, updates.channelPreferences);
    }
    if (updates.categoryPreferences) {
      for (const [category, preference] of Object.entries(updates.categoryPreferences)) {
        await this.preferenceService.updateCategoryPreference(
          accountUuid,
          category as NotificationCategory,
          preference,
        );
      }
    }
    if (updates.doNotDisturbConfig) {
      const pref = await this.preferenceService.getOrCreatePreference(accountUuid);
      const currentDnd = pref.doNotDisturb;
      if (currentDnd) {
        const newDnd = { ...currentDnd, ...updates.doNotDisturbConfig };

        if (newDnd.enabled && newDnd.startTime && newDnd.endTime && newDnd.daysOfWeek) {
          await this.preferenceService.enableDoNotDisturb(
            accountUuid,
            newDnd.startTime,
            newDnd.endTime,
            newDnd.daysOfWeek,
          );
        } else if (newDnd.enabled === false) {
          await this.preferenceService.disableDoNotDisturb(accountUuid);
        }
      }
    }

    const preference = await this.preferenceService.getOrCreatePreference(accountUuid);
    return toNotificationPreferenceClientDTO(preference.toServerDTO());
  }
}
