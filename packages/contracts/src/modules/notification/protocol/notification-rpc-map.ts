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
  GetNotificationStatsRes,
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
import type {
  DeleteNotificationInvocation,
  MarkNotificationReadInvocation,
  NotificationBatchInvocation,
  ReplayDeadLetterInvocation,
} from '../api/notification-invocation.schemas';
import type {
  NotificationResponseSchema,
  NotificationBatchResultSchema,
  UnreadCountResponseSchema,
} from '../api/response-schemas';
import { z } from 'zod';

// === Notification Module RPC Map ===
// Phase 4: every map entry corresponds to a live HTTP route / IPC channel with
// the SAME canonical request shape. Protocol-only operations (execute-action,
// send, retry, channel:list, get-stats, update) remain documented as explicit
// unsupported transport surfaces — never a silently different payload on one host.
export type NotificationRpcMap = {
  // === CRUD / status ===
  'notification:create': [CreateNotificationReq, CreateNotificationRes];
  'notification:update': [UpdateNotificationReq, UpdateNotificationRes];
  'notification:delete': [DeleteNotificationInvocation, null];
  'notification:mark-read': [
    MarkNotificationReadInvocation,
    z.infer<typeof NotificationResponseSchema>,
  ];
  'notification:mark-all-read': [void, z.infer<typeof UnreadCountResponseSchema>];
  'notification:query': [NotificationQuery, NotificationListRes];

  // === Batch operations ===
  'notification:mark-as-read-batch': [MarkAsReadBatchReq, MarkAsReadBatchRes];
  'notification:delete-batch': [DeleteNotificationsBatchReq, DeleteNotificationsBatchRes];
  'notification:clear-all': [
    NotificationBatchInvocation,
    z.infer<typeof NotificationBatchResultSchema>,
  ];
  'notification:cleanup-old': [CleanupOldNotificationsReq, CleanupOldNotificationsRes];

  // === Statistics ===
  'notification:get-stats': [GetNotificationStatsReq, GetNotificationStatsRes];
  'notification:unread-count': [void, z.infer<typeof UnreadCountResponseSchema>];

  // === Dead-letter ===
  'notification:dead-letter-replay': [
    ReplayDeadLetterInvocation,
    z.infer<typeof NotificationResponseSchema>,
  ];

  // === Actions (protocol-only; no live transport) ===
  'notification:execute-action': [ExecuteNotificationActionReq, ExecuteNotificationActionRes];

  // === Preferences ===
  'notification-preference:update': [
    UpdateNotificationPreferenceReq,
    UpdateNotificationPreferenceRes,
  ];
  'notification-preference:get': [GetNotificationPreferenceReq, GetNotificationPreferenceRes];

  // === Channels (protocol-only; no live transport) ===
  'notification:send': [SendNotificationReq, SendNotificationRes];
  'notification-channel:retry': [RetryChannelReq, RetryChannelRes];
  'notification-channel:list': [ListNotificationChannelsReq, ListNotificationChannelsRes];
};
