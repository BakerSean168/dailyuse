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
import { createApiResponseBuilder } from '../../shared/infrastructure/http/response-builder.js';
import { getApiDashboardData } from './dashboard-read-service.js';

export const DashboardApiModule: IApiModule = {
  name: 'Dashboard',

  register(context: IApiModuleContext) {
    const { router, middleware, db } = context;
    const dashboardRouter = Router();
    const prisma = db as PrismaClient;

    // GET /dashboard/stats — Aggregated dashboard statistics
    dashboardRouter.get('/stats', middleware.auth, async (req, res) => {
      const responseBuilder = createApiResponseBuilder(req);

      try {
        const authReq = req as AuthenticatedRequest;
        const identityId = authReq.user?.identityId;

        if (!identityId) {
          res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
          return;
        }

        const data = await getApiDashboardData(prisma, identityId);

        res.json(responseBuilder.success(data, 'Success'));
      } catch (err) {
        res.status(500).json(responseBuilder.internalError('Failed to fetch dashboard stats'));
      }
    });

    router.use('/dashboard', dashboardRouter);
  },
};
