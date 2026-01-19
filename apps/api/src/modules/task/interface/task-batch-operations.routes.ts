/**
 * Task Batch Operations Routes
 * 任务的批量操作（批量更新优先级、批量取消等）
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

// Stub handler for not-yet-implemented endpoints
const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * Task Batch Operations 路由配置
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /tasks/batch/update-priority:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 批量更新任务优先级
 *     description: 批量更新多个任务的重要性和紧急程度
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskUuids
 *             properties:
 *               taskUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *               importance:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *               urgency:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *     responses:
 *       200:
 *         description: 批量更新成功
 */
router.post('/batch/update-priority', _stubController);

/**
 * @swagger
 * /tasks/batch/cancel:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 批量取消任务
 *     description: 批量取消多个任务
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskUuids
 *             properties:
 *               taskUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 批量取消成功
 */
router.post('/batch/cancel', _stubController);

export function registerTaskBatchOperationsRoutes(): Router {
  return router;
}
