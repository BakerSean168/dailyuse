import type {
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
  NotificationStatsRes,
  ExecuteNotificationActionReq,
  ExecuteNotificationActionRes,
  UpdateNotificationPreferenceReq,
  UpdateNotificationPreferenceRes,
  GetNotificationPreferenceReq,
  GetNotificationPreferenceRes,
  SendNotificationReq,
  SendNotificationRes,
  RetryChannelReq,
  RetryChannelRes,
  ListNotificationChannelsReq,
  ListNotificationChannelsRes,
} from '../api';

// === Notification Module RPC Map ===
export type NotificationRpcMap = {
  // === CRUD Operations ===
  'notification:create': [CreateNotificationReq, CreateNotificationRes];
  'notification:update': [UpdateNotificationReq, UpdateNotificationRes];
  'notification:query': [NotificationQuery, NotificationListRes];
  
  // === Batch Operations ===
  'notification:mark-as-read-batch': [MarkAsReadBatchReq, MarkAsReadBatchRes];
  'notification:delete-batch': [DeleteNotificationsBatchReq, DeleteNotificationsBatchRes];
  'notification:cleanup-old': [CleanupOldNotificationsReq, CleanupOldNotificationsRes];
  
  // === Statistics ===
  'notification:get-stats': [GetNotificationStatsReq, NotificationStatsRes];
  
  // === Actions ===
  'notification:execute-action': [ExecuteNotificationActionReq, ExecuteNotificationActionRes];
  
  // === Preferences ===
  'notification-preference:update': [UpdateNotificationPreferenceReq, UpdateNotificationPreferenceRes];
  'notification-preference:get': [GetNotificationPreferenceReq, GetNotificationPreferenceRes];
  
  // === Channels ===
  'notification:send': [SendNotificationReq, SendNotificationRes];
  'notification-channel:retry': [RetryChannelReq, RetryChannelRes];
  'notification-channel:list': [ListNotificationChannelsReq, ListNotificationChannelsRes];
};
