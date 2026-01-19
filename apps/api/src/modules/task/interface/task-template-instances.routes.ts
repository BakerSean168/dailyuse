/**
 * Task Template Instances Routes
 * 任务模板实例的生成和管理
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

// Stub handler for not-yet-implemented endpoints
const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * Task Template Instances 路由配置
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /task-templates/{uuid}/instances:
 *   get:
 *     tags: [Task Templates]
 *     summary: 根据日期范围获取模板实例
 *     description: 获取指定任务模板在指定日期范围内的所有实例
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务模板UUID
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: number
 *         description: 起始日期（时间戳）
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: number
 *         description: 结束日期（时间戳）
 *     responses:
 *       200:
 *         description: 成功返回任务实例列表
 *       400:
 *         description: 缺少必需参数或参数格式错误
 *       404:
 *         description: 任务模板不存在
 */
router.get('/:uuid/instances', _stubController);

/**
 * @swagger
 * /task-templates/{id}/generate-instances:
 *   post:
 *     tags: [Task Templates]
 *     summary: 生成任务实例
 *     description: 根据模板和重复规则生成任务实例
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toDate
 *             properties:
 *               toDate:
 *                 type: number
 *                 description: 生成到的日期（时间戳）
 *     responses:
 *       200:
 *         description: 成功生成任务实例
 */
router.post('/:id/generate-instances', _stubController);

export function registerTaskTemplateInstancesRoutes(): Router {
  return router;
}
