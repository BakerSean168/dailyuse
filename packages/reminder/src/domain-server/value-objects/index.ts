/**
 * Reminder Module Value Objects - Domain Server
 *
 * 从 @dailyuse/domain-shared 重新导出值对象
 */

// IDs
export {
  ReminderTemplateId,
  ReminderGroupId,
  ReminderInstanceId,
  ReminderHistoryId,
  ReminderResponseId,
} from '../../domain-shared/value-objects';

// Enum-like Value Objects
export {
  ReminderType,
  ReminderStatus,
  TriggerType,
  ControlMode,
  ReminderNotificationChannel,
  ReminderResponseAction,
  TriggerResult,
} from '../../domain-shared/value-objects';

// Class-type Value Objects
export {
  ReminderNotificationConfig,
  TriggerConfig,
  ActiveTimeConfig,
  ActiveHoursConfig,
  GroupStats,
  ResponseMetrics,
  FrequencyAdjustment,
} from '../../domain-shared/value-objects';

// 为保持向后兼容，提供别名
export { ReminderNotificationConfig as NotificationConfig } from '../../domain-shared/value-objects/reminder-notification-config';
