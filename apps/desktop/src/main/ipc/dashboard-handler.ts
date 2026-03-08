/**
 * Dashboard IPC Handler
 *
 * Handles 'dashboard:get-stats' channel for the desktop renderer.
 * Aggregates statistics from multiple domain modules.
 *
 * TODO: Wire up actual data aggregation from Goal, Task, Schedule,
 *       Reminder, Notification modules once their SQLite modules
 *       are accessible via a shared context.
 */

import { ipcMain } from 'electron';

const CHANNEL = 'dashboard:get-stats';

export function registerDashboardIpcHandler(): void {
  ipcMain.handle(CHANNEL, async () => {
    // TODO: Aggregate real data from domain modules
    return {
      ok: true,
      data: {
        stats: {
          activeTasks: 0,
          completedToday: 0,
          activeGoals: 0,
          upcomingReminders: 0,
          unreadNotifications: 0,
          scheduleConflicts: 0,
        },
        activityTimeline: [],
        trendDays: [],
        goalProgress: [],
        taskBoard: { todo: 0, inProgress: 0, done: 0, overdue: 0 },
        upcomingSchedule: [],
      },
    };
  });
}

export function unregisterDashboardIpcHandler(): void {
  ipcMain.removeHandler(CHANNEL);
}
