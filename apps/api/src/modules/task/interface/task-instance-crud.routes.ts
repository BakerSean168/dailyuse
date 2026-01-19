/**
 * Task Instance CRUD Routes
 * 任务实例的基本操作（创建、读取、删除）
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

// Stub handler for not-yet-implemented endpoints
const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * Task Instance CRUD 路由配置
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /task-instances/check-expired:
 *   post:
 *     tags: [Task Instances]
 *     summary: 检查过期的任务实例
 *     description: 检查并标记所有过期的任务实例
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功检查并标记过期任务
 */
router.post('/check-expired', _stubController);

/**
 * @swagger
 * /task-instances:
 *   get:
 *     tags: [Task Instances]
 *     summary: 获取任务实例列表
 *     description: 获取用户的任务实例列表，支持多种过滤条件
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateUuid
 *         schema:
 *           type: string
 *         description: 按模板UUID过滤
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, SKIPPED, EXPIRED]
 *         description: 按状态过滤
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: number
 *         description: 开始日期（时间戳）
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: number
 *         description: 结束日期（时间戳）
 *     responses:
 *       200:
 *         description: 成功返回任务实例列表
 */
router.get('/', _stubController);

/**
 * @swagger
 * /task-instances/{id}:
 *   get:
 *     tags: [Task Instances]
 *     summary: 获取任务实例详情
 *     description: 根据UUID获取任务实例详细信息
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
 *         description: 成功返回任务实例详情
 *       404:
 *         description: 任务实例不存在
 *   delete:
 *     tags: [Task Instances]
 *     summary: 删除任务实例
 *     description: 删除指定的任务实例
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
 *         description: 删除成功
 *       404:
 *         description: 任务实例不存在
 */
router.get('/:id', _stubController);
router.delete('/:id', _stubController);

export function registerTaskInstanceCrudRoutes(): Router {
  return router;
}
