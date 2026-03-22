/**
 * Dashboard API Module
 *
 * Aggregation endpoint that returns combined statistics from all modules.
 * This is infrastructure-level (not a domain concern) since it aggregates
 * read-only data across multiple bounded contexts.
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import type { IApiModule, IApiModuleContext } from '../../shared/contracts/api-module.js';
import type { AuthenticatedRequest } from '../../shared/infrastructure/http/middlewares/authMiddleware.js';
import { getApiDashboardData } from './dashboard-read-service.js';

export const DashboardApiModule: IApiModule = {
  name: 'Dashboard',

  register(context: IApiModuleContext) {
    const { router, middleware, db } = context;
    const dashboardRouter = Router();
    const prisma = db as PrismaClient;

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

        const data = await getApiDashboardData(prisma, identityId);

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
