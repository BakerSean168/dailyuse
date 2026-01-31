/**
 * Notification Module - API Request/Response DTOs
 * 通知模块 API 请求响应类型定义
 *
 * 所有前端 API 客户端使用的类型都在这里定义
 */

import type { NotificationServerDTO } from './aggregates/notification-server';
import type { NotificationChannelServerDTO } from './entities/notification-channel-server';
import type { NotificationTemplateAggregateServerDTO } from './aggregates/notification-template-server';
import type { NotificationPreferenceServerDTO } from './aggregates/notification-preference-server';
import type {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
  RelatedEntityType,
  NotificationChannelType,
} from './enums';
import type { ImportanceLevel, UrgencyLevel } from '../../shared/index';
import type {
  NotificationActionServerDTO,
  NotificationMetadataServerDTO,
  CategoryPreferenceServerDTO,
} from './value-objects';

// ============ API 响应类型（服务端返回给前端）============

/**
 * 单个通知响应
 */
export type NotificationDTO = NotificationServerDTO;

/**
 * 通知列表响应
 */
export interface NotificationListResponseDTO {
  notifications: NotificationServerDTO[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 通知统计响应
 */
export interface NotificationStatsResponseDTO {
  unreadCount: number;
  totalCount: number;
  byCategory: Record<NotificationCategory, number>;
  byType: Record<NotificationType, number>;
  byStatus: Record<NotificationStatus, number>;
}

/**
 * 单个通知渠道响应
 */
export type NotificationChannelDTO = NotificationChannelServerDTO;

/**
 * 通知渠道列表响应
 */
export interface NotificationChannelListResponseDTO {
  channels: NotificationChannelServerDTO[];
  total: number;
}

/**
 * 单个通知模板响应
 */
export type NotificationTemplateDTO = NotificationTemplateAggregateServerDTO;

/**
 * 通知模板列表响应
 */
export interface NotificationTemplateListResponseDTO {
  templates: NotificationTemplateAggregateServerDTO[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * 通知偏好响应
 */
export type NotificationPreferenceDTO = NotificationPreferenceServerDTO;

/**
 * 模板渲染结果响应
 */
export interface TemplateRenderResultDTO {
  title: string;
  content: string;
}

/**
 * 模板验证结果响应
 */
export interface TemplateValidationResultDTO {
  isValid: boolean;
  missingVariables: string[];
  errors?: string[];
}

// ============ API 请求类型（前端发送给服务端）============

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
  actions?: NotificationActionServerDTO[];
  metadata?: NotificationMetadataServerDTO;
  expiresAt?: number;
  sendImmediately?: boolean;
  channels?: NotificationChannelType[]; // 指定发送渠道
}

/**
 * 更新通知请求
 */
export interface UpdateNotificationRequest {
  title?: string;
  content?: string;
  status?: NotificationStatus;
  metadata?: NotificationMetadataServerDTO;
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
  startDate?: number; // epoch ms
  endDate?: number; // epoch ms
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
  beforeDays: number; // 删除多少天前的通知
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
  variables: Record<string, any>;
  sendImmediately?: boolean;
  channels?: NotificationChannelType[];
}

/**
 * 渲染模板请求
 */
export interface RenderTemplateRequest {
  templateUuid: string;
  variables: Record<string, any>;
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
  channels?: NotificationChannelType[]; // 指定渠道，不指定则使用默认渠道
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
