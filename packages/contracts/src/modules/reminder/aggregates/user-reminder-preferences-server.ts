/**
 * User Reminder Preferences Aggregate Root - Server
 * 用户提醒偏好聚合根 - 服务端
 */

import type { UserReminderPreferencesId, IdentityId } from '../../../primitives';
// Residual 751: TimeSlotDTO owned by value-objects/time-slot (z.infer of TimeSlotSchema).
export type { TimeSlotDTO } from '../value-objects/time-slot';

// ============ DTO 定义 ============

/**
 * User Reminder Preferences Server DTO
 */
export interface UserReminderPreferencesServerDTO {
  id: UserReminderPreferencesId;
  identityId: IdentityId;
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
  id: UserReminderPreferencesId;
  identityId: IdentityId;
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

