/**
 * FocusMode Contracts
 * 专注周期聚焦模式的类型定义
 */

import { z } from 'zod';

/**
 * 隐藏模式枚举
 */
export type HiddenGoalsMode = 'hide' | 'dim' | 'collapse';

/**
 * FocusMode Persistence DTO
 */
export interface FocusModePersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  actualEndTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * FocusMode 服务端 DTO
 */
export interface FocusModeServerDTO {
  uuid: string;
  accountUuid: string;
  focusedGoalUuids: string[]; // 聚焦的目标 UUID 列表 (1-3个)
  startTime: number; // 聚焦开始时间 (timestamp)
  endTime: number; // 聚焦结束时间 (timestamp)
  hiddenGoalsMode: HiddenGoalsMode; // 隐藏模式
  isActive: boolean; // 是否激活
  actualEndTime: number | null; // 实际结束时间（提前结束时记录）
  createdAt: number;
  updatedAt: number;
}

/**
 * FocusMode 客户端 DTO
 */
export interface FocusModeClientDTO {
  uuid: string;
  accountUuid: string;
  focusedGoalUuids: string[];
  startTime: number;
  endTime: number;
  isActive: boolean;
  remainingDays: number; // 计算属性：剩余天数
  hiddenGoalsMode: HiddenGoalsMode;
}

/**
 * 开启聚焦请求
 */
export interface ActivateFocusModeRequest {
  focusedGoalUuids: string[]; // 1-3个目标
  endTime: number; // 结束时间 (timestamp)
  hiddenGoalsMode?: HiddenGoalsMode; // 隐藏模式，默认 'hide'
}

/**
 * 延长聚焦请求
 */
export interface ExtendFocusModeRequest {
  newEndTime: number; // 新的结束时间 (timestamp)
}

/**
 * Zod Schema 验证
 */
export const ActivateFocusModeRequestSchema = z.object({
  focusedGoalUuids: z
    .array(z.string().uuid())
    .min(1, '至少选择 1 个目标')
    .max(3, '最多选择 3 个目标'),
  endTime: z.number().int().positive(),
  hiddenGoalsMode: z.enum(['hide', 'dim', 'collapse']).optional().default('hide'),
});

export const ExtendFocusModeRequestSchema = z.object({
  newEndTime: z.number().int().positive(),
});

/**
 * 类型导出
 */
export type ActivateFocusModeRequestValidated = z.infer<typeof ActivateFocusModeRequestSchema>;
export type ExtendFocusModeRequestValidated = z.infer<typeof ExtendFocusModeRequestSchema>;
