/**
 * Notification Module API Request Types
 * 通知模块 API 请求类型
 */

import type {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
  NotificationChannelType,
  NotificationActionDTO,
  NotificationMetadataDTO,
  CategoryPreferenceDTO,
} from '../value-objects';
import type { ImportanceLevel, UrgencyLevel } from '../../../shared/index';

// ============ 通知请求 ============

/**
 * 创建通知请求
 */
export interface CreateNotificationRequest {
  accountUuid: string;
  title: string;
  content: string;
  type: NotificationType;
  category: NotificationCategory;
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  relatedEntityType?: RelatedEntityType;
  relatedEntityUuid?: string;
  actions?: NotificationActionDTO[];
  metadata?: NotificationMetadataDTO;
  expiresAt?: number;
  sendImmediately?: boolean;
  channels?: NotificationChannelType[];
}

/**
 * 更新通知请求
 */
export interface UpdateNotificationRequest {
  title?: string;
  content?: string;
  status?: NotificationStatus;
  metadata?: NotificationMetadataDTO;
  expiresAt?: number;
}

/**
 * 通知查询参数
 */
export interface NotificationQueryParamsDTO {
  accountUuid?: string;
  type?: NotificationType;
  category?: NotificationCategory;
  status?: NotificationStatus;
  isRead?: boolean;
  relatedEntityType?: RelatedEntityType;
  relatedEntityUuid?: string;
  startDate?: number;
  endDate?: number;
  keyword?: string;
  pagination?: {
    page: number;
    limit: number;
  };
  sortBy?: 'createdAt' | 'updatedAt' | 'sentAt' | 'importance' | 'urgency';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 批量标记已读请求
 */
export interface MarkAsReadBatchRequest {
  notificationUuids: string[];
}

/**
 * 批量删除请求
 */
export interface DeleteNotificationsBatchRequest {
  notificationUuids: string[];
}

/**
 * 清理旧通知请求
 */
export interface CleanupOldNotificationsRequest {
  accountUuid: string;
  beforeDays: number;
  category?: NotificationCategory;
}

/**
 * 创建通知模板请求
 */
export interface CreateNotificationTemplateRequest {
  name: string;
  type: NotificationType;
  category: NotificationCategory;
  description?: string;
  template: {
    title: string;
    content: string;
    variables: string[];
  };
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  emailTemplate?: {
    subject: string;
    htmlBody: string;
    textBody?: string;
  };
  pushTemplate?: {
    title: string;
    body: string;
    icon?: string;
    sound?: string;
  };
  isSystemTemplate?: boolean;
}

/**
 * 更新通知模板请求
 */
export interface UpdateNotificationTemplateRequest {
  name?: string;
  description?: string;
  template?: {
    title?: string;
    content?: string;
    variables?: string[];
  };
  channels?: {
    inApp?: boolean;
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  isActive?: boolean;
}

/**
 * 从模板创建通知请求
 */
export interface CreateNotificationFromTemplateRequest {
  templateUuid: string;
  accountUuid: string;
  variables: Record<string, unknown>;
  sendImmediately?: boolean;
  channels?: NotificationChannelType[];
}

/**
 * 渲染模板请求
 */
export interface RenderTemplateRequest {
  templateUuid: string;
  variables: Record<string, unknown>;
}

/**
 * 更新通知偏好请求
 */
export interface UpdateNotificationPreferenceRequest {
  enabled?: boolean;
  channels?: {
    inApp?: boolean;
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  categories?: {
    task?: Partial<CategoryPreferenceServerDTO>;
    goal?: Partial<CategoryPreferenceServerDTO>;
    schedule?: Partial<CategoryPreferenceServerDTO>;
    reminder?: Partial<CategoryPreferenceServerDTO>;
    account?: Partial<CategoryPreferenceServerDTO>;
    system?: Partial<CategoryPreferenceServerDTO>;
  };
  doNotDisturb?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
  rateLimit?: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  };
}

/**
 * 发送通知请求
 */
export interface SendNotificationRequest {
  notificationUuid: string;
  channels?: NotificationChannelType[];
}

/**
 * 重试渠道请求
 */
export interface RetryChannelRequest {
  channelUuid: string;
}

/**
 * 执行通知操作请求
 */
export interface ExecuteNotificationActionRequest {
  notificationUuid: string;
  actionId: string;
}
