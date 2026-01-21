import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';
import { ScheduleStatisticsApplicationService } from '@dailyuse/application-server/schedule';

export function registerScheduleStatisticsRoutes(service?: ScheduleStatisticsApplicationService): Router {
  const router: ExpressRouter = Router();

  if (!service) {
      router.get('/', (_req, res) => res.status(501).json({ message: 'Not implemented' }));
      return router;
  }

  return router;
}