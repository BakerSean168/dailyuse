/**
 * TaskReminderConfig Value Object - Server Interface
 * 任务提醒配置值对�?- 服务端接�?
 */

import type { TaskReminderType } from './task-reminder-type';
import type { ReminderTimeUnit } from './reminder-time-unit';
import type { TaskReminderConfigClientDTO } from './task-reminder-config-client';

// ============ 接口定义 ============

interface ReminderTrigger {
  type: TaskReminderType;
  absoluteTime: number | null;
  relativeValue: number | null;
  relativeUnit: ReminderTimeUnit | null;
}

export interface TaskReminderConfigServer {
  enabled: boolean;
  triggers: ReminderTrigger[];

  equals(other: TaskReminderConfigServer): boolean;
}

// ============ DTO 定义 ============

export interface TaskReminderConfigServerDTO {
  enabled: boolean;
  triggers: ReminderTrigger[];
}

export interface TaskReminderConfigPersistenceDTO {
  enabled: boolean;
  triggers: string; // JSON
}
