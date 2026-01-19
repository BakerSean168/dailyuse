import { Router, type Router as ExpressRouter } from 'express';

/**
 * @swagger
 * tags:
 *   - name: Task Statistics
 *     description: 任务统计相关接口
 */

/**
 * TaskStatistics 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 */
const router: ExpressRouter = Router();

/**
 * @swagger
 * /task-statistics/{accountUuid}:
 *   get:
 *     tags: [Task Statistics]
 *     summary: 获取任务统计数据
 *     description: 获取指定账户的任务统计信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *       - in: query
 *         name: forceRecalculate
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否强制重新计算
 *     responses:
 *       200:
 *         description: 成功返回统计数据
 *       401:
 *         description: 未授权
 *   delete:
 *     tags: [Task Statistics]
 *     summary: 删除统计数据
 *     description: 删除指定账户的统计数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.get('/:accountUuid', TaskStatisticsController.getStatistics);
router.delete('/:accountUuid', TaskStatisticsController.deleteStatistics);

/**
 * @swagger
 * /task-statistics/{accountUuid}/recalculate:
 *   post:
 *     tags: [Task Statistics]
 *     summary: 重新计算任务统计
 *     description: 重新计算指定账户的任务统计数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 default: true
 *                 description: 是否强制重算
 *     responses:
 *       200:
 *         description: 重算成功
 */
router.post('/:accountUuid/recalculate', TaskStatisticsController.recalculateStatistics);

/**
 * @swagger
 * /task-statistics/{accountUuid}/update-template-stats:
 *   post:
 *     tags: [Task Statistics]
 *     summary: 更新模板统计
 *     description: 更新任务模板相关的统计信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.post('/:accountUuid/update-template-stats', TaskStatisticsController.updateTemplateStats);

/**
 * @swagger
 * /task-statistics/{accountUuid}/update-instance-stats:
 *   post:
 *     tags: [Task Statistics]
 *     summary: 更新实例统计
 *     description: 更新任务实例相关的统计信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.post('/:accountUuid/update-instance-stats', TaskStatisticsController.updateInstanceStats);

/**
 * @swagger
 * /task-statistics/{accountUuid}/update-completion-stats:
 *   post:
 *     tags: [Task Statistics]
 *     summary: 更新完成统计
 *     description: 更新任务完成相关的统计信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 更新成功
 */
router.post(
  '/:accountUuid/update-completion-stats',
  TaskStatisticsController.updateCompletionStats,
);

/**
 * @swagger
 * /task-statistics/{accountUuid}/today-completion-rate:
 *   get:
 *     tags: [Task Statistics]
 *     summary: 获取今日完成率
 *     description: 获取今日任务的完成率
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 成功返回完成率
 */
router.get('/:accountUuid/today-completion-rate', TaskStatisticsController.getTodayCompletionRate);

/**
 * @swagger
 * /task-statistics/{accountUuid}/week-completion-rate:
 *   get:
 *     tags: [Task Statistics]
 *     summary: 获取本周完成率
 *     description: 获取本周任务的完成率
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 成功返回完成率
 */
router.get('/:accountUuid/week-completion-rate', TaskStatisticsController.getWeekCompletionRate);

/**
 * @swagger
 * /task-statistics/{accountUuid}/efficiency-trend:
 *   get:
 *     tags: [Task Statistics]
 *     summary: 获取效率趋势
 *     description: 获取任务完成效率的趋势
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountUuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 账户UUID
 *     responses:
 *       200:
 *         description: 成功返回趋势数据
 */
router.get('/:accountUuid/efficiency-trend', TaskStatisticsController.getEfficiencyTrend);

export function registerTaskStatisticsRoutes(): Router {
  return router;
}
