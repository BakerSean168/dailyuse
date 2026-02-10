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
} from '@/domain-shared';

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
} from '@/domain-shared';

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
} from '@/domain-shared';

// 为保持向后兼容，提供别名
export { ReminderNotificationConfig as NotificationConfig } from '@/domain-shared';
