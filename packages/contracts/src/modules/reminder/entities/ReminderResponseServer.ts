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
  uuid: string;
  reminderTemplateUuid: string;
  action: ReminderResponseAction;
  responseTime?: number | null; // 响应时间（从发送到响应的秒数，CLICKED/COMPLETED 时有值）
  timestamp: number; // 响应时间戳 (epoch ms)
}

/**
 * Reminder Response Client DTO
 */
export interface ReminderResponseClientDTO {
  uuid: string;
  reminderTemplateUuid: string;
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
  uuid: string;
  reminderTemplateUuid: string;
  action: ReminderResponseAction;
  responseTime?: Date | null;
  timestamp: Date;
}

// ============ 实体接口 ============

/**
 * Reminder Response 实体接口
 */
export interface ReminderResponseServer {
  uuid: string;
  reminderTemplateUuid: string;
  action: ReminderResponseAction;
  responseTime?: Date | null;
  timestamp: Date;

  // 业务方法
  isClicked(): boolean;
  isIgnored(): boolean;
  isSnoozed(): boolean;
  isDismissed(): boolean;
  isCompleted(): boolean;
  isPositiveResponse(): boolean; // CLICKED 或 COMPLETED
  isNegativeResponse(): boolean; // IGNORED 或 DISMISSED
  getResponseWeight(): number; // 响应权重：COMPLETED(1.5), CLICKED(1.0), SNOOZED(-0.2), DISMISSED(-0.3), IGNORED(-0.5)

  // 转换方法
  toServerDTO(): ReminderResponseServerDTO;
  toClientDTO(): ReminderResponseClientDTO;
  toPersistenceDTO(): ReminderResponsePersistenceDTO;
}

/**
 * Reminder Response 静态工厂方法接口
 */
export interface ReminderResponseServerStatic {
  /**
   * 创建新的 Reminder Response（静态工厂方法）
   */
  create(params: {
    reminderTemplateUuid: string;
    action: ReminderResponseAction;
    responseTime?: Date;
    timestamp?: Date;
  }): ReminderResponseServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: ReminderResponseServerDTO): ReminderResponseServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: ReminderResponsePersistenceDTO): ReminderResponseServer;
}
