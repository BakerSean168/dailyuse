/**
 * Task Queries Routes
 * 任务的查询操作（按日期、状态、优先级、目标等）
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';

// Stub handler for not-yet-implemented endpoints
const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * Task Queries 路由配置
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /tasks/{uuid}/history:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取任务历史记录
 *     description: 获取任务的所有变更历史
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 成功返回任务历史
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                       changes:
 *                         type: object
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: 任务不存在
 */
router.get('/:uuid/history', _stubController);

/**
 * @swagger
 * /tasks/today:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取今日任务
 *     description: 获取今天需要完成的所有任务
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回今日任务列表
 */
router.get('/today', _stubController);

/**
 * @swagger
 * /tasks/overdue:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取逾期任务
 *     description: 获取所有已逾期的任务
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回逾期任务列表
 */
router.get('/overdue', _stubController);

/**
 * @swagger
 * /tasks/upcoming:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取即将到期的任务
 *     description: 获取未来N天内到期的任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *         description: 未来天数
 *     responses:
 *       200:
 *         description: 成功返回即将到期的任务列表
 */
router.get('/upcoming', _stubController);

/**
 * @swagger
 * /tasks/by-priority:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 按优先级排序获取任务
 *     description: 获取按优先级降序排列的任务列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 成功返回按优先级排序的任务列表
 */
router.get('/by-priority', _stubController);

/**
 * @swagger
 * /tasks/dashboard:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取任务仪表板
 *     description: 获取任务仪表板数据（包括今日、逾期、即将到期、高优先级等）
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回仪表板数据
 */
router.get('/dashboard', _stubController);

/**
 * @swagger
 * /tasks/blocked:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取阻塞的任务
 *     description: 获取所有处于阻塞状态的任务
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回阻塞任务列表
 */
router.get('/blocked', _stubController);

/**
 * @swagger
 * /tasks/by-date-range:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 按日期范围获取任务
 *     description: 获取指定日期范围内的任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.get('/by-date-range', _stubController);

/**
 * @swagger
 * /tasks/by-tags:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 按标签获取任务
 *     description: 根据标签获取任务列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tags
 *         required: true
 *         schema:
 *           type: string
 *         description: 标签列表（逗号分隔）
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.get('/by-tags', _stubController);

/**
 * @swagger
 * /tasks/by-goal/{goalUuid}:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 根据目标获取任务
 *     description: 获取关联到指定目标的所有任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goalUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.get('/by-goal/:goalUuid', _stubController);

/**
 * @swagger
 * /tasks/by-key-result/{keyResultUuid}:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 根据关键结果获取任务
 *     description: 获取关联到指定关键结果的所有任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: keyResultUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.get('/by-key-result/:keyResultUuid', _stubController);

/**
 * @swagger
 * /tasks/{parentUuid}/subtasks:
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取子任务列表
 *     description: 获取指定任务的所有子任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentUuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功返回子任务列表
 */
router.get('/:parentUuid/subtasks', _stubController);

export function registerTaskQueriesRoutes(): Router {
  return router;
}
