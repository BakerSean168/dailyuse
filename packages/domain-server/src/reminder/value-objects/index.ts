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
} from '@dailyuse/domain-shared/reminder';

// Enum-like Value Objects
export {
  ReminderType,
  ReminderStatus,
  TriggerType,
  RecurrenceType,
  WeekDay,
  ControlMode,
  ReminderNotificationChannel,
  ReminderResponseAction,
  TriggerResult,
} from '@dailyuse/domain-shared/reminder';

// Class-type Value Objects
export {
  RecurrenceConfig,
  ReminderNotificationConfig,
  TriggerConfig,
  ActiveTimeConfig,
  ActiveHoursConfig,
  ReminderStats,
  GroupStats,
  ResponseMetrics,
  FrequencyAdjustment,
} from '@dailyuse/domain-shared/reminder';

// 为保持向后兼容，提供别名
export { ReminderNotificationConfig as NotificationConfig } from '@dailyuse/domain-shared/reminder';
