/**
 * Task Template Goals Routes
 * 任务模板与OKR目标的绑定操作
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

// Stub handler for not-yet-implemented endpoints
const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * Task Template Goals 路由配置
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /task-templates/{id}/bind-goal:
 *   post:
 *     tags: [Task Templates]
 *     summary: 绑定到目标
 *     description: 将任务模板绑定到OKR目标
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - goalUuid
 *               - keyResultUuid
 *               - incrementValue
 *             properties:
 *               goalUuid:
 *                 type: string
 *                 description: 目标UUID
 *               keyResultUuid:
 *                 type: string
 *                 description: 关键结果UUID
 *               incrementValue:
 *                 type: number
 *                 description: 完成任务时增加的值
 *     responses:
 *       200:
 *         description: 成功绑定到目标
 */
router.post('/:id/bind-goal', _stubController);

/**
 * @swagger
 * /task-templates/{id}/unbind-goal:
 *   post:
 *     tags: [Task Templates]
 *     summary: 解除目标绑定
 *     description: 解除任务模板与OKR目标的绑定
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
 *         description: 成功解除绑定
 */
router.post('/:id/unbind-goal', _stubController);

export function registerTaskTemplateGoalsRoutes(): Router {
  return router;
}
