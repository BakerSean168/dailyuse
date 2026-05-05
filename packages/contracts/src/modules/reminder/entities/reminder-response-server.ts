/**
 * Reminder Response Entity - Server
 * 提醒响应实体 - 服务端
 */

/**
 * 响应行为类型
 */
export const ReminderResponseAction = {
  Clicked: 'CLICKED',
  Ignored: 'IGNORED',
  Snoozed: 'SNOOZED',
  Dismissed: 'DISMISSED',
  Completed: 'COMPLETED',
} as const;

export type ReminderResponseAction =
  (typeof ReminderResponseAction)[keyof typeof ReminderResponseAction];

// ============ DTO 定义 ============

/**
 * Reminder Response Server DTO
 */
export interface ReminderResponseServerDTO {
  id: string;
  reminderTemplateId: string;
  identityId: string;
  action: ReminderResponseAction;
  responseTime?: number | null; // 响应时间（从发送到响应的秒数，CLICKED/COMPLETED 时有值）
  timestamp: number; // 响应时间戳 (epoch ms)
}

/**
 * Reminder Response Client DTO
 */
export interface ReminderResponseClientDTO {
  id: string;
  reminderTemplateId: string;
  action: ReminderResponseAction;
  responseTime?: number | null;
  timestamp: number;
}
