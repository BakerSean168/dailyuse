/**
 * Task Operations Routes
 * 任务的操作端点（开始、完成、阻塞、取消、链接目标等）
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

// Stub handler for not-yet-implemented endpoints
const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * Task Operations 路由配置
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /tasks/{uuid}/start:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 开始任务
 *     description: 将任务状态更改为进行中
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务已开始
 */
router.post('/:uuid/start', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/complete:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 完成任务
 *     description: 将任务标记为已完成
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务已完成
 */
router.post('/:uuid/complete', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/block:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 阻塞任务
 *     description: 将任务标记为阻塞状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务已阻塞
 */
router.post('/:uuid/block', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/unblock:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 解除任务阻塞
 *     description: 解除任务的阻塞状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务阻塞已解除
 */
router.post('/:uuid/unblock', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/cancel:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 取消任务
 *     description: 将任务标记为已取消
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务已取消
 */
router.post('/:uuid/cancel', _stubController);

/**
 * @swagger
 * /tasks/{uuid}/link-goal:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 关联任务到目标
 *     description: 将任务关联到指定的目标和关键结果
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
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
 *               - goalUuid
 *             properties:
 *               goalUuid:
 *                 type: string
 *               keyResultUuid:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务已关联到目标
 *   delete:
 *     tags: [One-Time Tasks]
 *     summary: 解除任务与目标的关联
 *     description: 解除任务与目标和关键结果的关联
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 任务已解除关联
 */
router.post('/:uuid/link-goal', _stubController);
router.delete('/:uuid/link-goal', _stubController);

export function registerTaskOperationsRoutes(): Router {
  return router;
}
