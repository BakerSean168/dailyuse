/**
 * Schedule Task Routes
 * 处理日程下的任务管理和执行
 *
 * 端点:
 * - POST   /api/schedules/tasks           - 创建任务
 * - GET    /api/schedules/tasks           - 获取任务列表
 * - GET    /api/schedules/tasks/:id       - 获取任务详情
 * - PUT    /api/schedules/tasks/:id       - 更新任务
 * - DELETE /api/schedules/tasks/:id       - 删除任务
 * - PATCH  /api/schedules/tasks/:id/pause - 暂停任务
 * - PATCH  /api/schedules/tasks/:id/resume - 继续任务
 * - POST   /api/schedules/tasks/:id/complete - 完成任务
 * - POST   /api/schedules/tasks/:id/cancel - 取消任务
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ScheduleApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleTaskRoutes');
const responseBuilder = createResponseBuilder();

export function registerScheduleTaskRoutes(): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/schedules/tasks:
   *   post:
   *     tags: [Schedule Tasks]
   *     summary: 创建任务
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - scheduleId
   *               - title
   *               - estimatedTime
   *             properties:
   *               scheduleId:
   *                 type: string
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               estimatedTime:
   *                 type: integer
   *                 description: 估计耗时（分钟）
   *               priority:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *               dependencies:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: 任务创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const task = await service.createTask(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(task, 'Task created'));
    } catch (error) {
      logger.error('Create task failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/tasks:
   *   get:
   *     tags: [Schedule Tasks]
   *     summary: 获取任务列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: scheduleId
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, running, completed, cancelled, paused]
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: 成功获取任务列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const tasks = await service.getUserTasks(
        req.user.accountUuid,
        {
          scheduleId: req.query.scheduleId as string,
          status: req.query.status as string,
        },
        page,
        limit,
      );
      res.json(responseBuilder.success(tasks, 'Tasks retrieved'));
    } catch (error) {
      logger.error('Get tasks failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/tasks/{id}:
   *   get:
   *     tags: [Schedule Tasks]
   *     summary: 获取任务详情
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 成功获取任务
   *       404:
   *         description: 任务不存在
   */
  router.get('/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const task = await service.getTask(req.params.id);
      res.json(responseBuilder.success(task, 'Task retrieved'));
    } catch (error) {
      logger.error('Get task failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/tasks/{id}:
   *   put:
   *     tags: [Schedule Tasks]
   *     summary: 更新任务
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               estimatedTime:
   *                 type: integer
   *               priority:
   *                 type: integer
   *     responses:
   *       200:
   *         description: 任务更新成功
   *       404:
   *         description: 任务不存在
   */
  router.put('/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const updated = await service.updateTask(req.params.id, req.body);
      res.json(responseBuilder.success(updated, 'Task updated'));
    } catch (error) {
      logger.error('Update task failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/tasks/{id}:
   *   delete:
   *     tags: [Schedule Tasks]
   *     summary: 删除任务
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 任务删除成功
   *       404:
   *         description: 任务不存在
   */
  router.delete('/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      await service.deleteTask(req.params.id);
      res.json(responseBuilder.success(null, 'Task deleted'));
    } catch (error) {
      logger.error('Delete task failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/tasks/{id}/pause:
   *   patch:
   *     tags: [Schedule Tasks]
   *     summary: 暂停任务
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 任务已暂停
   */
  router.patch('/:id/pause', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const updated = await service.pauseTask(req.params.id);
      res.json(responseBuilder.success(updated, 'Task paused'));
    } catch (error) {
      logger.error('Pause task failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/tasks/{id}/resume:
   *   patch:
   *     tags: [Schedule Tasks]
   *     summary: 恢复任务
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 任务已恢复
   */
  router.patch('/:id/resume', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const updated = await service.resumeTask(req.params.id);
      res.json(responseBuilder.success(updated, 'Task resumed'));
    } catch (error) {
      logger.error('Resume task failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/tasks/{id}/complete:
   *   post:
   *     tags: [Schedule Tasks]
   *     summary: 完成任务
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               actualTime:
   *                 type: integer
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: 任务已完成
   */
  router.post('/:id/complete', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const updated = await service.completeTask(req.params.id, req.body);
      res.json(responseBuilder.success(updated, 'Task completed'));
    } catch (error) {
      logger.error('Complete task failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/tasks/{id}/cancel:
   *   post:
   *     tags: [Schedule Tasks]
   *     summary: 取消任务
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: 任务已取消
   */
  router.post('/:id/cancel', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const updated = await service.cancelTask(req.params.id, req.body.reason);
      res.json(responseBuilder.success(updated, 'Task cancelled'));
    } catch (error) {
      logger.error('Cancel task failed:', error);
      throw error;
    }
  });

  return router;
}
