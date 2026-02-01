/**
 * Notification Module API - Barrel Export
 * 通知模块 API 导出
 */

// ===== Requests =====
export type {
  CreateNotificationRequest,
  UpdateNotificationRequest,
  NotificationQueryParamsDTO,
  MarkAsReadBatchRequest,
  DeleteNotificationsBatchRequest,
  CleanupOldNotificationsRequest,
  CreateNotificationTemplateRequest,
  UpdateNotificationTemplateRequest,
  CreateNotificationFromTemplateRequest,
  RenderTemplateRequest,
  UpdateNotificationPreferenceRequest,
  SendNotificationRequest,
  RetryChannelRequest,
  ExecuteNotificationActionRequest,
} from './requests';

// ===== Responses =====
export type {
  NotificationListResponseDTO,
  NotificationStatsResponseDTO,
  NotificationChannelListResponseDTO,
  NotificationTemplateListResponseDTO,
  TemplateRenderResultDTO,
  TemplateValidationResultDTO,
} from './responses';
