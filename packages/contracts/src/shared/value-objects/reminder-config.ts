import type { ScheduleConfig, ScheduleConfigDTO } from './schedule-config';
import type { NotificationConfig, NotificationConfigDTO } from './notification-config';
/**
 * [组合对象] 完整的提醒配置
 * 很多实体会直接持有这个对象
 */
export interface ReminderConfig {
    schedule: ScheduleConfig;
    notify: NotificationConfig;
}
export interface ReminderConfigDTO {
  schedule: ScheduleConfigDTO;
  notify: NotificationConfigDTO;
}
