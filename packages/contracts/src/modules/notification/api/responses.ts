/**
 * Notification Module API Response Types
 * 通知模块 API 响应类型
 */

import type { NotificationServerDTO } from '../aggregates/notification-server';
import type { NotificationChannelServerDTO } from '../entities/notification-channel-server';
import type { NotificationTemplateAggregateServerDTO } from '../aggregates/notification-template-server';
import type { NotificationPreferenceServerDTO } from '../aggregates/notification-preference-server';
import type {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
} from '../value-objects';

// ============ API 响应类型 ============

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
