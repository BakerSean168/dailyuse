import { Router, type Router as ExpressRouter } from 'express';

/**
 * @swagger
 * tags:
 *   - name: Task Instances
 *     description: 任务实例管理相关接口
 */

/**
 * TaskInstance 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 */
const router: ExpressRouter = Router();

// ============ 聚合根操作路由 ============

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
router.post('/:id/start', TaskInstanceController.startTaskInstance);

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
router.post('/:id/complete', TaskInstanceController.completeTaskInstance);

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
router.post('/:id/skip', TaskInstanceController.skipTaskInstance);

// ============ 基本 CRUD 路由 ============

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
router.post('/check-expired', TaskInstanceController.checkExpiredInstances);

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
router.get('/', TaskInstanceController.getTaskInstances);

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
router.get('/:id', TaskInstanceController.getTaskInstance);
router.delete('/:id', TaskInstanceController.deleteTaskInstance);

export function registerTaskInstanceRoutes(): Router {
  return router;
}
