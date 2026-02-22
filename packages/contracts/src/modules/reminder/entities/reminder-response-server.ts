/**
 * Reminder Response Entity - Server
 * 提醒响应实体 - 服务端
 */

/**
 * 响应行为类型
 */
export type ReminderResponseAction = 'CLICKED' | 'IGNORED' | 'SNOOZED' | 'DISMISSED' | 'COMPLETED';

// ============ DTO 定义 ============

/**
 * Reminder Response Server DTO
 */
export interface ReminderResponseServerDTO {
  id: string;
  reminderTemplateId: string;
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
  // UI 显示文本
  actionText: string; // "点击" | "忽略" | "延迟" | "关闭" | "完成"
  responseTimeText?: string; // "30秒后响应" | "2分钟后响应"
}

/**
 * Reminder Response Persistence DTO
 */
export interface ReminderResponsePersistenceDTO {
  id: string;
  reminderTemplateId: string;
  action: ReminderResponseAction;
  responseTime?: Date | null;
  timestamp: Date;
}
