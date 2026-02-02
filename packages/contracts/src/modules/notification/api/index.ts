/**
 * Notification Module API - Barrel Export
 * 通知模块 API 导出
 */

// ===== CRUD Operations =====
export {
  CreateNotificationSchema,
  type CreateNotificationReq,
  type CreateNotificationRes,
  UpdateNotificationSchema,
  type UpdateNotificationReq,
  type UpdateNotificationRes,
  NotificationQuerySchema,
  type NotificationQuery,
  type NotificationListRes,
  MarkAsReadBatchSchema,
  type MarkAsReadBatchReq,
  type MarkAsReadBatchRes,
  DeleteNotificationsBatchSchema,
  type DeleteNotificationsBatchReq,
  type DeleteNotificationsBatchRes,
  CleanupOldNotificationsSchema,
  type CleanupOldNotificationsReq,
  type CleanupOldNotificationsRes,
  type GetNotificationStatsReq,
  type NotificationStatsRes,
  ExecuteNotificationActionSchema,
  type ExecuteNotificationActionReq,
  type ExecuteNotificationActionRes,
} from './crud';

// ===== Preferences =====
export {
  UpdateNotificationPreferenceSchema,
  type UpdateNotificationPreferenceReq,
  type UpdateNotificationPreferenceRes,
  type GetNotificationPreferenceReq,
  type GetNotificationPreferenceRes,
} from './preferences';

// ===== Channels =====
export {
  SendNotificationSchema,
  type SendNotificationReq,
  type SendNotificationRes,
  RetryChannelSchema,
  type RetryChannelReq,
  type RetryChannelRes,
  type ListNotificationChannelsReq,
  type ListNotificationChannelsRes,
} from './channels';
