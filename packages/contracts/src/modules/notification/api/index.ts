/**
 * Notification Module API Contracts (Grouped by operation type)
 */

// === Notification CRUD Operations ===
export {
  CreateNotificationSchema,
  UpdateNotificationSchema,
  NotificationQuerySchema,
  MarkAsReadBatchSchema,
  DeleteNotificationsBatchSchema,
  CleanupOldNotificationsSchema,
  ExecuteNotificationActionSchema,
} from './crud';
export type {
  CreateNotificationReq,
  CreateNotificationRes,
  UpdateNotificationReq,
  UpdateNotificationRes,
  NotificationQuery,
  NotificationListRes,
  MarkAsReadBatchReq,
  MarkAsReadBatchRes,
  DeleteNotificationsBatchReq,
  DeleteNotificationsBatchRes,
  CleanupOldNotificationsReq,
  CleanupOldNotificationsRes,
  GetNotificationStatsReq,
  GetNotificationStatsRes,
  ExecuteNotificationActionReq,
  ExecuteNotificationActionRes,
} from './crud';

// === Channel Operations ===
export {
  SendNotificationSchema,
  RetryChannelSchema,
} from './crud';
export type {
  SendNotificationReq,
  SendNotificationRes,
  RetryChannelReq,
  RetryChannelRes,
  ListNotificationChannelsReq,
  ListNotificationChannelsRes,
} from './crud';

// === Preference Operations ===
export {
  UpdateNotificationPreferenceSchema,
} from './crud';
export type {
  UpdateNotificationPreferenceReq,
  UpdateNotificationPreferenceRes,
  GetNotificationPreferenceReq,
  GetNotificationPreferenceRes,
} from './crud';
