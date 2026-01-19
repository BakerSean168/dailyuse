/**
 * Task Instance State Routes
 * 任务实例的状态操作（开始、完成、跳过）- DDD 聚合根操作
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

// Stub handler for not-yet-implemented endpoints
const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * Task Instance State 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /task-instances/{id}/start:
 *   post:
 *     tags: [Task Instances]
 *     summary: 开始任务实例
 *     description: 将任务实例状态从 PENDING 转换为 IN_PROGRESS
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务实例UUID
 *     responses:
 *       200:
 *         description: 成功开始任务
 *       404:
 *         description: 任务实例不存在
 *       400:
 *         description: 任务实例无法开始（状态不正确）
 */
router.post('/:id/start', _stubController);

/**
 * @swagger
 * /task-instances/{id}/complete:
 *   post:
 *     tags: [Task Instances]
 *     summary: 完成任务实例
 *     description: 将任务实例标记为已完成
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务实例UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: number
 *                 description: 实际耗时（毫秒）
 *               note:
 *                 type: string
 *                 description: 完成笔记
 *               rating:
 *                 type: number
 *                 description: 完成评分（1-5）
 *     responses:
 *       200:
 *         description: 成功完成任务
 *       404:
 *         description: 任务实例不存在
 *       400:
 *         description: 任务实例无法完成（状态不正确）
 */
router.post('/:id/complete', _stubController);

/**
 * @swagger
 * /task-instances/{id}/skip:
 *   post:
 *     tags: [Task Instances]
 *     summary: 跳过任务实例
 *     description: 将任务实例标记为已跳过
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务实例UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 跳过原因
 *     responses:
 *       200:
 *         description: 成功跳过任务
 *       404:
 *         description: 任务实例不存在
 *       400:
 *         description: 任务实例无法跳过（状态不正确）
 */
router.post('/:id/skip', _stubController);

export function registerTaskInstanceStateRoutes(): Router {
  return router;
}
