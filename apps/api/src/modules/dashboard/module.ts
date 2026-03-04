/**
 * Dashboard API Module
 *
 * Aggregation endpoint that returns combined statistics from all modules.
 * This is infrastructure-level (not a domain concern) since it aggregates
 * read-only data across multiple bounded contexts.
 */

import { Router } from 'express';
import type { IApiModule, IApiModuleContext } from '../../shared/contracts/api-module.js';
import type { AuthenticatedRequest } from '../../shared/infrastructure/http/middlewares/authMiddleware.js';

export const DashboardApiModule: IApiModule = {
  name: 'Dashboard',

  register(context: IApiModuleContext) {
    const { router, middleware, db } = context;
    const dashboardRouter = Router();

    // GET /dashboard/stats — Aggregated dashboard statistics
    dashboardRouter.get('/stats', middleware.auth, async (req, res) => {
      try {
        const authReq = req as AuthenticatedRequest;
        const identityId = authReq.user?.identityId;

        if (!identityId) {
          res
            .status(401)
            .json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
          return;
        }

        // Return default/empty dashboard data.
        // TODO: Wire up real aggregation queries across modules when services are implemented.
        const now = Date.now();
        const DAY = 86_400_000;

        const data = {
          stats: {
            activeTasks: 0,
            completedToday: 0,
            activeGoals: 0,
            upcomingReminders: 0,
            unreadNotifications: 0,
            scheduleConflicts: 0,
          },
          activityTimeline: [],
          trendDays: Array.from({ length: 7 }, (_, i) => {
            const date = new Date(now - (6 - i) * DAY);
            return {
              date: date.toISOString().slice(0, 10),
              tasksCompleted: 0,
              tasksCreated: 0,
              focusMinutes: 0,
            };
          }),
          goalProgress: [],
          taskBoard: { todo: 0, inProgress: 0, done: 0, overdue: 0 },
          upcomingSchedule: [],
        };

        res.json({ ok: true, code: 200, message: 'Success', data, timestamp: Date.now() });
      } catch (err) {
        res.status(500).json({
          ok: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard stats' },
        });
      }
    });

    router.use('/dashboard', dashboardRouter);
  },
};
