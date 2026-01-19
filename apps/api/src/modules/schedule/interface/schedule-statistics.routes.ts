import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * Schedule Statistics 路由配置
 * 统计信息路由
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /schedules/statistics:
 *   get:
 *     tags: [Schedule Statistics]
 *     summary: 获取统计信息
 *     description: 获取账户的调度任务统计信息（如果不存在则自动创建）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息获取成功
 */
router.get('/', _stubController);

/**
 * @swagger
 * /schedules/statistics/modules:
 *   get:
 *     tags: [Schedule Statistics]
 *     summary: 获取所有模块统计
 *     description: 获取所有模块（reminder, task, goal, notification）的统计信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 所有模块统计信息获取成功
 */
router.get('/modules', _stubController);

/**
 * @swagger
 * /schedules/statistics/module/{module}:
 *   get:
 *     tags: [Schedule Statistics]
 *     summary: 获取模块统计
 *     description: 获取指定模块的统计信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *           enum: [reminder, task, goal, notification]
 *         description: 模块名称
 *     responses:
 *       200:
 *         description: 模块统计信息获取成功
 *       404:
 *         description: 模块统计不存在
 */
router.get('/module/:module', _stubController);

/**
 * @swagger
 * /schedules/statistics/recalculate:
 *   post:
 *     tags: [Schedule Statistics]
 *     summary: 重新计算统计信息
 *     description: 从任务数据重新计算账户的统计信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息重新计算成功
 */
router.post('/recalculate', _stubController);

/**
 * @swagger
 * /schedules/statistics/reset:
 *   post:
 *     tags: [Schedule Statistics]
 *     summary: 重置统计信息
 *     description: 重置账户的统计信息为初始状态
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息重置成功
 */
router.post('/reset', _stubController);

/**
 * @swagger
 * /schedules/statistics:
 *   delete:
 *     tags: [Schedule Statistics]
 *     summary: 删除统计信息
 *     description: 删除账户的统计信息
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 统计信息删除成功
 */
router.delete('/', _stubController);

export function registerScheduleStatisticsRoutes(): Router {
  return router;
}
