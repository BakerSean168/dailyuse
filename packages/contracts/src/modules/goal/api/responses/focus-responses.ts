/**
 * Focus Responses
 */

import type { FocusSessionClientDTO } from '../../aggregates/focus-session-client';

/**
 * 当前专注状态
 */
export interface FocusStatusView {
  isActive: boolean;
  session: FocusSessionClientDTO | null;
  goalTitle?: string;
  remainingSeconds?: number;
  elapsedSeconds?: number;
}

/**
 * 专注历史统计
 */
export interface FocusHistoryView {
  sessions: FocusSessionClientDTO[];
  totalSessions: number;
  totalDurationMinutes: number;
  averageDurationMinutes: number;
  completionRate: number;
}

/**
 * 专注统计数据
 */
export interface FocusStatisticsView {
  todayDurationMinutes: number;
  weekDurationMinutes: number;
  monthDurationMinutes: number;
  totalSessions: number;
  completedSessions: number;
  averageSessionDurationMinutes: number;
  longestStreak: number;
  currentStreak: number;
}

/**
 * 番茄钟配置
 */
export interface PomodoroConfigView {
  focusDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  notificationEnabled: boolean;
}
