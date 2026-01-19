/**
 * Task Subtasks Routes
 * 任务的子任务管理
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

// Stub handler for not-yet-implemented endpoints
const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * Task Subtasks 路由配置
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /tasks/{parentUuid}/subtasks:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 创建子任务
 *     description: 为指定任务创建子任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentUuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               importance:
 *                 type: number
 *               urgency:
 *                 type: number
 *     responses:
 *       201:
 *         description: 子任务创建成功
 */
router.post('/:parentUuid/subtasks', _stubController);

export function registerTaskSubtasksRoutes(): Router {
  return router;
}
