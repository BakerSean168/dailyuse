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

export function registerReminderExecutionRoutes(service: ReminderApplicationService): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/reminders/executions:
   *   get:
   *     tags: [Reminder Executions]
   *     summary: 获取提醒执行历史
   * ...
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const filters = {
        reminderId: req.query.reminderId as string,
        status: req.query.status as string,
      };
      // @ts-ignore
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
   * ...
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      // @ts-ignore
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
   * ...
   */
  router.get('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      // @ts-ignore
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
   * ...
   */
  router.put('/:uuid/status', async (req: AuthenticatedRequest, res) => {
    try {
      // @ts-ignore
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
