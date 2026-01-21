import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';
import { ScheduleApplicationService } from '@dailyuse/application-server/schedule';

export function registerScheduleTaskRoutes(service?: ScheduleApplicationService): Router {
  const router: ExpressRouter = Router();

  if (!service) {
      router.get('/', (_req, res) => res.status(501).json({ message: 'Not implemented' }));
      return router;
  }

  router.get('/:id', async (req: Request, res: Response) => {
      try {
          const task = await service.getScheduleTask(req.params.id);
          if (!task) return res.status(404).json({ message: 'Not found' });
          res.json(task);
      } catch (err) {
          res.status(500).json({ message: (err as Error).message });
      }
  });

  return router;
}