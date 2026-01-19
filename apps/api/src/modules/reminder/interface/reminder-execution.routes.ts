/**
 * Reminder Execution Routes
 * 处理提醒的执行和历史记录
 *
 * 端点:
 * - GET    /api/reminders/executions      - 获取执行历史
 * - POST   /api/reminders/executions      - 手动触发提醒
 * - GET    /api/reminders/executions/:uuid - 获取执行详情
 * - PUT    /api/reminders/executions/:uuid/status - 更新执行状态
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ReminderApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderExecutionRoutes');
const responseBuilder = createResponseBuilder();

export function registerReminderExecutionRoutes(): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/reminders/executions:
   *   get:
   *     tags: [Reminder Executions]
   *     summary: 获取提醒执行历史
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: reminderId
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, SENT, CLICKED, DISMISSED, FAILED]
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
   *         description: 成功获取执行历史
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const filters = {
        reminderId: req.query.reminderId as string,
        status: req.query.status as string,
      };
      const executions = await service.getExecutionHistory(
        req.user.accountUuid,
        filters,
        page,
        limit,
      );
      res.json(responseBuilder.success(executions, 'Executions retrieved'));
    } catch (error) {
      logger.error('Get executions failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/executions:
   *   post:
   *     tags: [Reminder Executions]
   *     summary: 手动触发提醒
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - reminderId
   *             properties:
   *               reminderId:
   *                 type: string
   *               channel:
   *                 type: string
   *                 enum: [EMAIL, SMS, PUSH, IN_APP]
   *               customContent:
   *                 type: string
   *     responses:
   *       201:
   *         description: 提醒已触发
   *       404:
   *         description: 提醒不存在
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const execution = await service.triggerReminder(
        req.body.reminderId,
        req.user.accountUuid,
        req.body.channel || 'IN_APP',
        req.body.customContent,
      );
      res.status(201).json(responseBuilder.success(execution, 'Reminder triggered'));
    } catch (error) {
      logger.error('Trigger reminder failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/executions/{uuid}:
   *   get:
   *     tags: [Reminder Executions]
   *     summary: 获取执行详情
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 成功获取执行详情
   *       404:
   *         description: 执行记录不存在
   */
  router.get('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const execution = await service.getExecution(req.params.uuid);
      res.json(responseBuilder.success(execution, 'Execution retrieved'));
    } catch (error) {
      logger.error('Get execution failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/executions/{uuid}/status:
   *   put:
   *     tags: [Reminder Executions]
   *     summary: 更新执行状态
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
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
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [SENT, CLICKED, DISMISSED, FAILED]
   *               feedback:
   *                 type: string
   *     responses:
   *       200:
   *         description: 状态更新成功
   *       404:
   *         description: 执行记录不存在
   */
  router.put('/:uuid/status', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const updated = await service.updateExecutionStatus(
        req.params.uuid,
        req.body.status,
        req.body.feedback,
      );
      res.json(responseBuilder.success(updated, 'Status updated'));
    } catch (error) {
      logger.error('Update execution status failed:', error);
      throw error;
    }
  });

  return router;
}
