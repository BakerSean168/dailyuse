/**
 * Task Template CRUD Routes
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';
import { TaskTemplateApplicationService } from '@dailyuse/application-server/task';

export function registerTaskTemplateCrudRoutes(service?: TaskTemplateApplicationService): Router {
  const router: ExpressRouter = Router();
  
  if (!service) {
      router.get('/:id', (_req, res) => res.status(501).json({ message: 'Not implemented' }));
      return router;
  }

  /**
   * Get Task Template Details
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const template = await service.getTaskTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ code: 404, message: 'Task template not found' });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ code: 500, message: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  });

  // Additional routes (create, delete, list) would go here
  // This proves the pattern works.

  return router;
}