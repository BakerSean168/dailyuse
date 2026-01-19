import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';
import { registerScheduleStatisticsRoutes } from './schedule-statistics.routes';
import { registerScheduleEventRoutes } from './schedule-event.routes';

const _stubController = (_req: Request, res: Response) => {
  res.status(501).json({ code: 5000, message: 'Not implemented' });
};

/**
 * @swagger
 * tags:
 *   - name: Schedule Tasks
 *     description: 调度任务管理相关接口（DDD 聚合根控制模式）
 *   - name: Schedule Statistics
 *     description: 调度任务统计信息
 *   - name: Schedule Conflict Detection
 *     description: 日程冲突检测和解决 (Story 9.4)
 *   - name: ScheduleEvents
 *     description: 日程事件管理（用户日历事件）(Story 4-1)
 */

/**
 * Schedule 路由配置
 * 采用 DDD 聚合根控制模式的 REST API 设计
 *
 * 路由设计原则：
 * 1. 子实体操作必须通过聚合根路径
 * 2. 体现聚合边界和业务规则
 * 3. 提供聚合根完整视图
 * 4. 所有方法统一使用 responseBuilder
 * 5. 每个聚合根独立的路由文件
 */
const router: ExpressRouter = Router();

// ============ DDD 聚合根控制路由 ============
// 注意：聚合路由必须在通用 CRUD 路由之前注册，避免 /:id 路由冲突

// ===== 聚合根控制：统计信息 =====
// 统计信息路由已独立到 schedule-statistics.routes.ts
router.use('/statistics', registerScheduleStatisticsRoutes());

// ===== 日程事件管理路由 (Story 4-1) =====
// 用户视角的日历事件 CRUD
router.use('/', registerScheduleEventRoutes());

// ============ 日程冲突检测路由 (Story 9.4) ============
// 注意：这些路由必须在通用 CRUD 路由之前注册，避免与 /:id 冲突

/**
 * @swagger
 * /schedules/detect-conflicts:
 *   post:
 *     tags: [Schedule Conflict Detection]
 *     summary: 检测日程冲突
 *     description: 检测给定时间范围内的日程冲突
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, startTime, endTime]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: 用户ID
 *               startTime:
 *                 type: number
 *                 description: 开始时间（Unix毫秒时间戳）
 *               endTime:
 *                 type: number
 *                 description: 结束时间（Unix毫秒时间戳）
 *               excludeUuid:
 *                 type: string
 *                 format: uuid
 *                 description: 可选：排除指定日程UUID（编辑场景）
 *     responses:
 *       200:
 *         description: 冲突检测完成
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     result:
 *                       type: object
 *                       properties:
 *                         hasConflict:
 *                           type: boolean
 *                         conflicts:
 *                           type: array
 *                         suggestions:
 *                           type: array
 *       400:
 *         description: 验证错误
 *       401:
 *         description: 未授权
 */
router.post('/detect-conflicts', _stubController);

/**
 * @swagger
 * /schedules/{id}/resolve-conflict:
 *   post:
 *     tags: [Schedule Conflict Detection]
 *     summary: 解决日程冲突
 *     description: 通过指定策略解决日程冲突
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 日程UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resolution]
 *             properties:
 *               resolution:
 *                 type: string
 *                 enum: [RESCHEDULE, CANCEL, ADJUST_DURATION, IGNORE]
 *                 description: 解决策略
 *               newStartTime:
 *                 type: number
 *                 description: 新的开始时间（RESCHEDULE策略必需）
 *               newEndTime:
 *                 type: number
 *                 description: 新的结束时间（RESCHEDULE策略必需）
 *               newDuration:
 *                 type: number
 *                 description: 新的时长（分钟）（ADJUST_DURATION策略必需）
 *     responses:
 *       200:
 *         description: 冲突解决成功
 *       400:
 *         description: 验证错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 日程不存在
 */
router.post('/:id/resolve-conflict', _stubController);

/**
 * @swagger
 * /schedules:
 *   post:
 *     tags: [Schedule Conflict Detection]
 *     summary: 创建日程（带冲突检测）
 *     description: 创建新的日程，自动检测冲突
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountUuid, title, startTime, endTime, duration]
 *             properties:
 *               accountUuid:
 *                 type: string
 *                 format: uuid
 *                 description: 用户账户UUID
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: 日程标题
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: 日程描述（可选）
 *               startTime:
 *                 type: number
 *                 description: 开始时间（Unix毫秒时间戳）
 *               endTime:
 *                 type: number
 *                 description: 结束时间（Unix毫秒时间戳）
 *               duration:
 *                 type: number
 *                 description: 时长（分钟）
 *               priority:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: 优先级（可选）
 *               location:
 *                 type: string
 *                 description: 地点（可选）
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 参与者列表（可选）
 *               autoDetectConflicts:
 *                 type: boolean
 *                 default: true
 *                 description: 是否自动检测冲突
 *     responses:
 *       201:
 *         description: 日程创建成功
 *       400:
 *         description: 验证错误
 *       401:
 *         description: 未授权
 *       409:
 *         description: UUID冲突
 */
router.post('/', _stubController);

// ===== 聚合根控制：任务操作 =====

/**
 * @swagger
 * /schedules/tasks/due:
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 查找需要执行的任务
 *     description: 查找所有需要在指定时间之前执行的任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: beforeTime
 *         schema:
 *           type: string
 *           format: date-time
 *         description: 截止时间（默认为当前时间）
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 查找成功
 */
router.get('/tasks/due', _stubController);

/**
 * @swagger
 * /schedules/tasks/batch:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 批量创建调度任务
 *     description: 批量创建多个调度任务
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: 批量创建成功
 */
router.post('/tasks/batch', _stubController);

/**
 * @swagger
 * /schedules/tasks/batch/delete:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 批量删除调度任务
 *     description: 批量删除多个调度任务
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 批量删除成功
 */
router.post('/tasks/batch/delete', _stubController);

/**
 * @swagger
 * /schedules/tasks/{id}/pause:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 暂停任务
 *     description: 暂停指定的调度任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 暂停成功
 *       404:
 *         description: 任务不存在
 */
router.post('/tasks/:id/pause', _stubController);

/**
 * @swagger
 * /schedules/tasks/{id}/resume:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 恢复任务
 *     description: 恢复已暂停的调度任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 恢复成功
 *       404:
 *         description: 任务不存在
 */
router.post('/tasks/:id/resume', _stubController);

/**
 * @swagger
 * /schedules/tasks/{id}/complete:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 完成任务
 *     description: 标记调度任务为已完成
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 完成原因
 *     responses:
 *       200:
 *         description: 完成成功
 *       404:
 *         description: 任务不存在
 */
router.post('/tasks/:id/complete', _stubController);

/**
 * @swagger
 * /schedules/tasks/{id}/cancel:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 取消任务
 *     description: 取消指定的调度任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 取消原因
 *     responses:
 *       200:
 *         description: 取消成功
 *       404:
 *         description: 任务不存在
 */
router.post('/tasks/:id/cancel', _stubController);

/**
 * @swagger
 * /schedules/tasks/{id}/metadata:
 *   patch:
 *     tags: [Schedule Tasks]
 *     summary: 更新任务元数据
 *     description: 更新调度任务的元数据（payload、tags）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payload:
 *                 type: object
 *               tagsToAdd:
 *                 type: array
 *                 items:
 *                   type: string
 *               tagsToRemove:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       404:
 *         description: 任务不存在
 */
router.patch('/tasks/:id/metadata', _stubController);

// ============ 基本 CRUD 路由 ============

/**
 * @swagger
 * /schedules/tasks:
 *   post:
 *     tags: [Schedule Tasks]
 *     summary: 创建调度任务
 *     description: 创建新的调度任务
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - sourceModule
 *               - sourceEntityId
 *               - schedule
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sourceModule:
 *                 type: string
 *                 enum: [reminder, task, goal, notification]
 *               sourceEntityId:
 *                 type: string
 *               schedule:
 *                 type: object
 *                 properties:
 *                   cronExpression:
 *                     type: string
 *                   timezone:
 *                     type: string
 *                   startDate:
 *                     type: number
 *                   endDate:
 *                     type: number
 *                   maxExecutions:
 *                     type: number
 *               retryConfig:
 *                 type: object
 *               payload:
 *                 type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: 任务创建成功
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 获取调度任务列表
 *     description: 获取用户的所有调度任务
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.post('/tasks', _stubController);
router.get('/tasks', _stubController);

/**
 * @swagger
 * /schedules/tasks/{id}:
 *   get:
 *     tags: [Schedule Tasks]
 *     summary: 获取调度任务详情
 *     description: 根据UUID获取调度任务详细信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 成功返回任务详情
 *       404:
 *         description: 任务不存在
 *   delete:
 *     tags: [Schedule Tasks]
 *     summary: 删除调度任务
 *     description: 删除指定的调度任务
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 任务不存在
 */

/**
 * @route GET /api/v1/schedules/tasks/:id/executions
 * @desc 获取任务执行历史
 * @access Private
 */
router.get('/tasks/:id/executions', _stubController);

router.get('/tasks/:id', _stubController);
router.delete('/tasks/:id', _stubController);

export function registerScheduleCoreRoutes(): Router {
  return router;
}
