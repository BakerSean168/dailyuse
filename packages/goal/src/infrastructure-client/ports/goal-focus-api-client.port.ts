/**
 * Goal Focus API Client Port
 *
 * Interface for focus session operations.
 * Implemented by IPC adapter (Desktop) or HTTP adapter (Web).
 */

import type {
  FocusSessionClientDTO,
  FocusStatusDTO,
  FocusHistoryDTO,
  FocusStatisticsDTO,
  StartFocusRequest,
  GetFocusHistoryRequest,
} from '@dailyuse/contracts/goal';

/**
 * Goal Focus API Client Interface
 */
export interface IGoalFocusApiClient {
  // ===== Session Management =====

  /**
   * Start a focus session
   */
  startSession(request: StartFocusRequest): Promise<FocusSessionClientDTO>;

  /**
   * Pause the current session
   */
  pauseSession(): Promise<FocusSessionClientDTO>;

  /**
   * Resume the paused session
   */
  resumeSession(): Promise<FocusSessionClientDTO>;

  /**
   * Stop the current session
   * @param notes Optional notes for the session
   */
  stopSession(notes?: string): Promise<FocusSessionClientDTO | null>;

  // ===== Status & History =====

  /**
   * Get current focus status
   */
  getStatus(): Promise<FocusStatusDTO>;

  /**
   * Get focus history
   */
  getHistory(request: GetFocusHistoryRequest): Promise<FocusHistoryDTO>;

  /**
   * Get focus statistics
   */
  getStatistics(goalUuid?: string): Promise<FocusStatisticsDTO>;

  // ===== Convenience Methods =====

  /**
   * Check if there's an active focus session
   */
  isActive(): Promise<boolean>;

  /**
   * Get today's focus history for a goal
   */
  getTodayHistory(goalUuid?: string): Promise<FocusHistoryDTO>;

  /**
   * Get this week's focus history for a goal
   */
  getWeekHistory(goalUuid?: string): Promise<FocusHistoryDTO>;
}
