/**
 * Task Template State Routes
 * 任务模板的状态操作（激活、暂停、归档）
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';
import { TaskTemplateApplicationService } from '@dailyuse/application-server/task';

export function registerTaskTemplateStateRoutes(service?: TaskTemplateApplicationService): Router {
  const router: ExpressRouter = Router();

  if (!service) {
    const _stubController = (_req: Request, res: Response) => {
      res.status(501).json({ code: 5000, message: 'Not implemented' });
    };
    router.post('/:id/activate', _stubController);
    router.post('/:id/pause', _stubController);
    router.post('/:id/archive', _stubController);
    return router;
  }

  /**
   * @swagger
   * /task-templates/{id}/activate:
   *   post:
   *     tags: [Task Templates]
   *     summary: 激活任务模板
   *     description: 将任务模板状态设置为激活
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 任务模板UUID
   *     responses:
   *       200:
   *         description: 成功激活模板
   */
  router.post('/:id/activate', async (req: Request, res: Response) => {
    try {
      const result = await service.activateTaskTemplate(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  /**
   * @swagger
   * /task-templates/{id}/pause:
   *   post:
   *     tags: [Task Templates]
   *     summary: 暂停任务模板
   *     description: 将任务模板状态设置为暂停
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 任务模板UUID
   *     responses:
   *       200:
   *         description: 成功暂停模板
   */
  router.post('/:id/pause', async (req: Request, res: Response) => {
    try {
      const result = await service.pauseTaskTemplate(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  /**
   * @swagger
   * /task-templates/{id}/archive:
   *   post:
   *     tags: [Task Templates]
   *     summary: 归档任务模板
   *     description: 将任务模板状态设置为归档
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: 任务模板UUID
   *     responses:
   *       200:
   *         description: 成功归档模板
   */
  router.post('/:id/archive', async (req: Request, res: Response) => {
    try {
      const result = await service.archiveTaskTemplate(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  return router;
}
