import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';
import { ScheduleEventApplicationService } from '@dailyuse/application-server/schedule';

export function registerScheduleEventRoutes(service?: ScheduleEventApplicationService): Router {
  const router: ExpressRouter = Router();

  if (!service) {
      router.get('/', (_req, res) => res.status(501).json({ message: 'Not implemented' }));
      return router;
  }

  router.get('/:id', async (req: Request, res: Response) => {
      try {
          const event = await service.getSchedule(req.params.id);
          if (!event) return res.status(404).json({ message: 'Not found' });
          res.json(event);
      } catch (err) {
          res.status(500).json({ message: (err as Error).message });
      }
  });

  return router;
}