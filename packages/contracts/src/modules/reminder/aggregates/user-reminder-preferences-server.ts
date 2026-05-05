/**
 * User Reminder Preferences Aggregate Root - Server
 * 用户提醒偏好聚合根 - 服务端
 */

// ============ 值对象：TimeSlot ============

/**
 * Time Slot DTO
 * 时间段（用于记录最佳/最差响应时间段）
 */
export interface TimeSlotDTO {
  readonly hourStart: number; // 开始小时 (0-23)
  readonly hourEnd: number; // 结束小时 (0-23)
  readonly avgResponseRate: number; // 平均响应率 (0-100)
  readonly sampleCount: number; // 样本数量
}

// ============ DTO 定义 ============

/**
 * User Reminder Preferences Server DTO
 */
export interface UserReminderPreferencesServerDTO {
  id: string;
  identityId: string;
  bestTimeSlots: TimeSlotDTO[]; // 最佳时间段
  worstTimeSlots: TimeSlotDTO[]; // 最差时间段
  globalReminderEnabled: boolean; // 全局提醒总开关
  globalSmartFrequency: boolean; // 全局启用智能频率
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/**
 * User Reminder Preferences Client DTO
 */
export interface UserReminderPreferencesClientDTO {
  id: string;
  identityId: string;
  bestTimeSlots: TimeSlotDTO[];
  worstTimeSlots: TimeSlotDTO[];
  globalReminderEnabled: boolean;
  globalSmartFrequency: boolean;
  createdAt: number;
  updatedAt: number;
  // UI 显示文本
  bestTimeSlotsText: string; // "09:00-10:00, 18:00-19:00"
  worstTimeSlotsText: string; // "12:00-13:00, 22:00-23:00"
  summaryText?: string;
}

