/**
 * Dashboard API Module
 *
 * Aggregation endpoint that returns combined statistics from all modules.
 * This is infrastructure-level (not a domain concern) since it aggregates
 * read-only data across multiple bounded contexts.
 */

import { Router } from 'express';
import type { PrismaClient } from '@memoflow/database';
import type { IApiModule, IApiModuleContext } from '../../shared/contracts/api-module.js';
import type { ServerModuleContext } from '@memoflow/contracts/shared';
import type { AuthenticatedRequest } from '../../shared/infrastructure/http/middlewares/auth-middleware.js';
import { createApiResponseBuilder } from '../../shared/infrastructure/http/response-builder.js';
import { getApiDashboardData } from './dashboard-read-service.js';
import {
  PrismaActivityLedgerWriter,
  createActivityLedgerRecorder,
} from './activity-ledger.js';

export const DashboardApiModule: IApiModule = {
  name: 'Dashboard',

  register(context: IApiModuleContext & ServerModuleContext<PrismaClient>) {
    const { router, middleware, db } = context;
    const dashboardRouter = Router();
    const prisma = db;

    // R6：Activity Ledger——订阅关键业务事件写入 durable ledger。
    const ledgerRecorder = createActivityLedgerRecorder(
      new PrismaActivityLedgerWriter(prisma),
    );
    ledgerRecorder.start();

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
      } catch (_err) {
        res.status(500).json(responseBuilder.internalError('Failed to fetch dashboard stats'));
      }
    });

    router.use('/dashboard', dashboardRouter);
  },
};
