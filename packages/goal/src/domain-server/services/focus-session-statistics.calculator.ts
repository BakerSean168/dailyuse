import { FocusSession } from '../aggregates/focus-session';
import { FocusSessionStatus } from '@dailyuse/contracts/goal';

export interface FocusSessionStatistics {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  totalFocusMinutes: number;
  totalPauseMinutes: number;
  averageFocusMinutes: number;
  completionRate: number;
}

/**
 * FocusSessionStatisticsCalculator
 *
 * Pure read-side calculations for focus session statistics.
 */
export class FocusSessionStatisticsCalculator {
  calculate(sessions: FocusSession[]): FocusSessionStatistics {
    const completedSessions = sessions.filter((s) => s.status === FocusSessionStatus.Completed);
    const cancelledSessions = sessions.filter((s) => s.status === FocusSessionStatus.Cancelled);

    const totalFocusMinutes = completedSessions.reduce(
      (sum, s) => sum + s.actualDurationMinutes,
      0,
    );

    const totalPauseMinutes = sessions.reduce((sum, s) => sum + s.pausedDurationMinutes, 0);

    const averageFocusMinutes =
      completedSessions.length > 0 ? totalFocusMinutes / completedSessions.length : 0;

    const completionRate =
      sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0;

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      cancelledSessions: cancelledSessions.length,
      totalFocusMinutes: Math.round(totalFocusMinutes),
      totalPauseMinutes: Math.round(totalPauseMinutes),
      averageFocusMinutes: Math.round(averageFocusMinutes),
      completionRate: Math.round(completionRate),
    };
  }
}
