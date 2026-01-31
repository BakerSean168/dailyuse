/**
 * TaskReminderConfig Value Object - Server Interface
 */

import type { TaskReminderType } from './task-reminder-type';
import type { ReminderTimeUnit } from './reminder-time-unit';

// ============ 接口定义 ============

interface ReminderTrigger {
  type: TaskReminderType;
  absoluteTime: number | null;
  relativeValue: number | null;
  relativeUnit: ReminderTimeUnit | null;
}

export interface TaskReminderConfig {
  enabled: boolean;
  triggers: ReminderTrigger[];

}

// ============ DTO 定义 ============

export interface TaskReminderConfigDTO {
  enabled: boolean;
  triggers: ReminderTrigger[];
}

export interface TaskReminderConfigPersistenceDTO {
  enabled: boolean;
  triggers: string; // JSON
}
