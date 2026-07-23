/**
 * Goal - Focus Session Operations
 *
 * 专注会话管理：开始、停止专注，查询历史和统计
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { GoalId } from '../../../primitives';
import type { FocusSessionClientDTO } from '../aggregates/focus-session-client';

// ============================================================================
// START Focus
// ============================================================================

/**
 * 开始专注 Schema
 */
export const StartFocusSchema = z.object({
  goalId: brandedId<GoalId>().optional(),
  durationMinutes: z.number().int().min(1, '时长必须至少 1 分钟').max(480, '时长不能超过 480 分钟'),
  description: z.string().max(500).optional(),
});

export type StartFocusReq = z.infer<typeof StartFocusSchema>;

// ============================================================================
// STOP Focus
// ============================================================================

/**
 * 停止专注 Schema
 */
export const StopFocusSchema = z.object({
  notes: z.string().max(500).optional(),
});

export type StopFocusReq = z.infer<typeof StopFocusSchema>;

// ============================================================================
// GET Focus Status
// ============================================================================

/**
 * 获取专注状态
 */
export type GetFocusStatusReq = void;

export interface GetFocusStatusRes {
  isActive: boolean;
  session: FocusSessionClientDTO | null;
  goalTitle?: string;
  remainingSeconds?: number;
  elapsedSeconds?: number;
}

// ============================================================================
// QUERY Focus History
// ============================================================================

/**
 * 查询专注历史 Schema
 */
export const GetFocusHistorySchema = z.object({
  goalId: brandedId<GoalId>().optional(),
  startDate: z.number().int().optional(),
  endDate: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).default(20).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

export type GetFocusHistoryReq = z.infer<typeof GetFocusHistorySchema>;

export interface GetFocusHistoryRes {
  data: FocusSessionClientDTO[];
  totalSessions: number;
  totalDurationMinutes: number;
  averageDurationMinutes: number;
  completionRate: number;
}

// ============================================================================
// GET Focus Statistics
// ============================================================================

/**
 * 获取专注统计
 */
export type GetFocusStatisticsReq = void;

// Residual 777: focus statistics Res dual retired — sole ResSchema + z.infer.
export const GetFocusStatisticsResSchema = z.object({
  todayDurationMinutes: z.number(),
  weekDurationMinutes: z.number(),
  monthDurationMinutes: z.number(),
  totalSessions: z.number(),
  completedSessions: z.number(),
  averageSessionDurationMinutes: z.number(),
  longestStreak: z.number(),
  currentStreak: z.number(),
});
export type GetFocusStatisticsRes = z.infer<typeof GetFocusStatisticsResSchema>;

// ============================================================================
// GET Pomodoro Config
// ============================================================================

/**
 * 获取番茄钟配置
 */
export type GetPomodoroConfigReq = void;

// Residual 777: pomodoro config Res dual retired — sole ResSchema + z.infer.
export const GetPomodoroConfigResSchema = z.object({
  focusDurationMinutes: z.number(),
  shortBreakMinutes: z.number(),
  longBreakMinutes: z.number(),
  sessionsBeforeLongBreak: z.number(),
  autoStartBreaks: z.boolean(),
  autoStartFocus: z.boolean(),
  soundEnabled: z.boolean(),
  notificationEnabled: z.boolean(),
});
export type GetPomodoroConfigRes = z.infer<typeof GetPomodoroConfigResSchema>;
