/**
 * Notification Module Value Objects - Server
 *
 * IDs only from domain-shared. Enum-like VOs (NotificationType, NotificationCategory, etc.)
 * and class-type VOs (NotificationAction, NotificationMetadata, etc.) come from
 * @dailyuse/contracts/notification to avoid DTS export conflicts.
 */

// IDs only (no conflict with contracts)
export {
  NotificationId,
  NotificationChannelId,
  NotificationPreferenceId,
  NotificationTemplateId,
  NotificationHistoryId,
} from '../../domain-shared/value-objects';

// Server-only value objects (not in domain-shared)
export {
  NotificationTemplateConfig,
  type NotificationTemplateConfigServer,
} from './notification-template-config';
