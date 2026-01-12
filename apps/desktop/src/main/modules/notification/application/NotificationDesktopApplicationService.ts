/**
 * Notification Desktop Application Service - Facade Pattern
 *
 * 包装 @dailyuse/application-server/notification 的所有 Use Cases
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 * 
 * 所有具体的业务逻辑都委托给 services 文件夹中的专门服务
 */

import {
  createNotificationService,
  getNotificationService,
  listNotificationsService,
  listUnreadNotificationsService,
  getUnreadCountService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
  getPreferenceService,
  getOrCreatePreferenceService,
  updatePreferenceService,
  getStatisticsSummaryService,
} from './services';

import type { CreateNotificationRequest } from '@dailyuse/contracts/notification';
import type {
  NotificationClientDTO,
  NotificationPreferenceClientDTO,
  NotificationCategory,
  CategoryPreferenceServerDTO,
  DoNotDisturbConfigServerDTO,
} from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationDesktopAppService');

export class NotificationDesktopApplicationService {
  constructor() {
    // Container should be initialized by infrastructure module
  }

  async create(input: CreateNotificationRequest): Promise<NotificationClientDTO> {
    return createNotificationService(input);
  }

  async get(uuid: string, includeChildren = false): Promise<NotificationClientDTO | null> {
    return getNotificationService(uuid, includeChildren);
  }

  async list(
    accountUuid: string,
    options?: { includeRead?: boolean; limit?: number; offset?: number },
  ): Promise<NotificationClientDTO[]> {
    return listNotificationsService(accountUuid, options);
  }

  async listUnread(
    accountUuid: string,
    limit?: number,
  ): Promise<NotificationClientDTO[]> {
    return listUnreadNotificationsService(accountUuid, limit);
  }

  async getUnreadCount(accountUuid: string): Promise<number> {
    return getUnreadCountService(accountUuid);
  }

  async markAsRead(uuid: string): Promise<void> {
    await markAsReadService(uuid);
  }

  async markAllAsRead(accountUuid: string): Promise<void> {
    await markAllAsReadService(accountUuid);
  }

  async delete(uuid: string, soft = true): Promise<void> {
    await deleteNotificationService(uuid, soft);
  }

  // ===== Notification Preferences =====

  async getPreference(accountUuid: string): Promise<NotificationPreferenceClientDTO | null> {
    return getPreferenceService(accountUuid);
  }

  async getOrCreatePreference(accountUuid: string): Promise<NotificationPreferenceClientDTO> {
    return getOrCreatePreferenceService(accountUuid);
  }

  async updatePreference(
    accountUuid: string,
    updates: Partial<{
      channelPreferences: { inApp?: boolean; push?: boolean; email?: boolean; sms?: boolean };
      categoryPreferences: Record<NotificationCategory, Partial<CategoryPreferenceServerDTO>>;
      doNotDisturbConfig: Partial<DoNotDisturbConfigServerDTO>;
    }>,
  ): Promise<NotificationPreferenceClientDTO> {
    return updatePreferenceService(accountUuid, updates);
  }

  // ===== Statistics =====

  async getStatisticsSummary(accountUuid: string): Promise<{
    total: number;
    unread: number;
    read: number;
  }> {
    return getStatisticsSummaryService(accountUuid);
  }
}
