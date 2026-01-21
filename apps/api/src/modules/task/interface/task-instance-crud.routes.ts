/**
 * Task Instance CRUD Routes
 * 任务实例的基本操作（创建、读取、删除）
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';
import { TaskInstanceApplicationService } from '@dailyuse/application-server/task';

export function registerTaskInstanceCrudRoutes(service?: TaskInstanceApplicationService): Router {
  const router: ExpressRouter = Router();
  
  // Use stub if service not provided (during transition)
  if (!service) {
      router.get('/:id', (_req, res) => res.status(501).json({ message: 'Not implemented' }));
      router.delete('/:id', (_req, res) => res.status(501).json({ message: 'Not implemented' }));
      return router;
  }

  /**
   * Get Task Instance Details
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const instance = await service.getTaskInstance(req.params.id);
      if (!instance) {
        return res.status(404).json({ code: 404, message: 'Task instance not found' });
      }
      res.json(instance);
    } catch (error) {
      res.status(500).json({ code: 500, message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  });

  /**
   * Delete Task Instance
   */
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      await service.deleteTaskInstance(req.params.id);
      res.json({ success: true });
    } catch (error) {
       res.status(500).json({ code: 500, message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  });

  return router;
}