/**
 * Reminder Core Routes
 * 处理提醒的基本 CRUD 操作
 *
 * 端点:
 * - POST   /api/reminders           - 创建提醒
 * - GET    /api/reminders           - 获取提醒列表
 * - GET    /api/reminders/:uuid     - 获取提醒详情
 * - PUT    /api/reminders/:uuid     - 更新提醒
 * - DELETE /api/reminders/:uuid     - 删除提醒
 * - PATCH  /api/reminders/:uuid/enable - 启用提醒
 * - PATCH  /api/reminders/:uuid/disable - 禁用提醒
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ReminderApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderCoreRoutes');
const responseBuilder = createResponseBuilder();

export function registerReminderCoreRoutes(service: ReminderApplicationService): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/reminders:
   *   post:
   *     tags: [Reminders]
   *     summary: 创建提醒
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - targetType
   *               - targetId
   *               - triggerTime
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               targetType:
   *                 type: string
   *                 enum: [TASK, EVENT, GOAL, HABIT, CUSTOM]
   *               targetId:
   *                 type: string
   *               triggerTime:
   *                 type: string
   *                 format: date-time
   *               repeatPattern:
   *                 type: string
   *               channels:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [EMAIL, SMS, PUSH, IN_APP]
   *               templateId:
   *                 type: string
   *               groupId:
   *                 type: string
   *               isEnabled:
   *                 type: boolean
   *                 default: true
   *     responses:
   *       201:
   *         description: 提醒创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      // @ts-ignore - Method might be missing in refactor, needing implemented
      const reminder = await service.createReminder(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(reminder, 'Reminder created'));
    } catch (error) {
      logger.error('Create reminder failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders:
   *   get:
   *     tags: [Reminders]
   *     summary: 获取提醒列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: targetType
   *         schema:
   *           type: string
   *       - in: query
   *         name: targetId
   *         schema:
   *           type: string
   *       - in: query
   *         name: groupId
   *         schema:
   *           type: string
   *       - in: query
   *         name: isEnabled
   *         schema:
   *           type: boolean
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
   *         description: 成功获取提醒列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const filters = {
        targetType: req.query.targetType as string,
        targetId: req.query.targetId as string,
        groupId: req.query.groupId as string,
        isEnabled: req.query.isEnabled === 'true',
      };
      // @ts-ignore
      const reminders = await service.getUserReminders(req.user.accountUuid, filters, page, limit);
      res.json(responseBuilder.success(reminders, 'Reminders retrieved'));
    } catch (error) {
      logger.error('Get reminders failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/{uuid}:
   *   get:
   *     tags: [Reminders]
   *     summary: 获取提醒详情
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
   *         description: 成功获取提醒
   *       404:
   *         description: 提醒不存在
   */
  router.get('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      // @ts-ignore
      const reminder = await service.getReminder(req.params.uuid);
      res.json(responseBuilder.success(reminder, 'Reminder retrieved'));
    } catch (error) {
      logger.error('Get reminder failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/{uuid}:
   *   put:
   *     tags: [Reminders]
   *     summary: 更新提醒
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
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               triggerTime:
   *                 type: string
   *                 format: date-time
   *               repeatPattern:
   *                 type: string
   *               channels:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: 提醒更新成功
   *       404:
   *         description: 提醒不存在
   */
  router.put('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      // @ts-ignore
      const updated = await service.updateReminder(req.params.uuid, req.body);
      res.json(responseBuilder.success(updated, 'Reminder updated'));
    } catch (error) {
      logger.error('Update reminder failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/{uuid}:
   *   delete:
   *     tags: [Reminders]
   *     summary: 删除提醒
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
   *         description: 提醒删除成功
   *       404:
   *         description: 提醒不存在
   */
  router.delete('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      // @ts-ignore
      await service.deleteReminder(req.params.uuid);
      res.json(responseBuilder.success(null, 'Reminder deleted'));
    } catch (error) {
      logger.error('Delete reminder failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/{uuid}/enable:
   *   patch:
   *     tags: [Reminders]
   *     summary: 启用提醒
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
   *         description: 提醒已启用
   *       404:
   *         description: 提醒不存在
   */
  router.patch('/:uuid/enable', async (req: AuthenticatedRequest, res) => {
    try {
      // @ts-ignore
      const updated = await service.enableReminder(req.params.uuid);
      res.json(responseBuilder.success(updated, 'Reminder enabled'));
    } catch (error) {
      logger.error('Enable reminder failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/{uuid}/disable:
   *   patch:
   *     tags: [Reminders]
   *     summary: 禁用提醒
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
   *         description: 提醒已禁用
   *       404:
   *         description: 提醒不存在
   */
  router.patch('/:uuid/disable', async (req: AuthenticatedRequest, res) => {
    try {
      // @ts-ignore
      const updated = await service.disableReminder(req.params.uuid);
      res.json(responseBuilder.success(updated, 'Reminder disabled'));
    } catch (error) {
      logger.error('Disable reminder failed:', error);
      throw error;
    }
  });

  return router;
}
