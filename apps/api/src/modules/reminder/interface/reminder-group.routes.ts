/**
 * Reminder Group Routes
 * 处理提醒分组和分组管理
 *
 * 端点:
 * - POST   /api/reminders/groups           - 创建分组
 * - GET    /api/reminders/groups           - 获取分组列表
 * - GET    /api/reminders/groups/:uuid     - 获取分组详情
 * - PUT    /api/reminders/groups/:uuid     - 更新分组
 * - DELETE /api/reminders/groups/:uuid     - 删除分组
 * - POST   /api/reminders/groups/:uuid/reminders - 添加提醒到分组
 * - DELETE /api/reminders/groups/:uuid/reminders/:reminderId - 从分组移除提醒
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ReminderApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderGroupRoutes');
const responseBuilder = createResponseBuilder();

export function registerReminderGroupRoutes(): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/reminders/groups:
   *   post:
   *     tags: [Reminder Groups]
   *     summary: 创建提醒分组
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
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               color:
   *                 type: string
   *               icon:
   *                 type: string
   *     responses:
   *       201:
   *         description: 分组创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const group = await service.createGroup(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(group, 'Group created'));
    } catch (error) {
      logger.error('Create group failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/groups:
   *   get:
   *     tags: [Reminder Groups]
   *     summary: 获取提醒分组列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
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
   *         description: 成功获取分组列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const groups = await service.getUserGroups(req.user.accountUuid, page, limit);
      res.json(responseBuilder.success(groups, 'Groups retrieved'));
    } catch (error) {
      logger.error('Get groups failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/groups/{uuid}:
   *   get:
   *     tags: [Reminder Groups]
   *     summary: 获取分组详情
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
   *         description: 成功获取分组
   *       404:
   *         description: 分组不存在
   */
  router.get('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const group = await service.getGroup(req.params.uuid);
      res.json(responseBuilder.success(group, 'Group retrieved'));
    } catch (error) {
      logger.error('Get group failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/groups/{uuid}:
   *   put:
   *     tags: [Reminder Groups]
   *     summary: 更新分组
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
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               color:
   *                 type: string
   *               icon:
   *                 type: string
   *     responses:
   *       200:
   *         description: 分组更新成功
   *       404:
   *         description: 分组不存在
   */
  router.put('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const updated = await service.updateGroup(req.params.uuid, req.body);
      res.json(responseBuilder.success(updated, 'Group updated'));
    } catch (error) {
      logger.error('Update group failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/groups/{uuid}:
   *   delete:
   *     tags: [Reminder Groups]
   *     summary: 删除分组
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
   *         description: 分组删除成功
   *       404:
   *         description: 分组不存在
   */
  router.delete('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      await service.deleteGroup(req.params.uuid);
      res.json(responseBuilder.success(null, 'Group deleted'));
    } catch (error) {
      logger.error('Delete group failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/groups/{uuid}/reminders:
   *   post:
   *     tags: [Reminder Groups]
   *     summary: 添加提醒到分组
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
   *               - reminderIds
   *             properties:
   *               reminderIds:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: 提醒添加成功
   */
  router.post('/:uuid/reminders', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const updated = await service.addRemindersToGroup(req.params.uuid, req.body.reminderIds);
      res.json(responseBuilder.success(updated, 'Reminders added to group'));
    } catch (error) {
      logger.error('Add reminders to group failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/groups/{uuid}/reminders/{reminderId}:
   *   delete:
   *     tags: [Reminder Groups]
   *     summary: 从分组移除提醒
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: reminderId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 提醒移除成功
   */
  router.delete('/:uuid/reminders/:reminderId', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const updated = await service.removeReminderFromGroup(req.params.uuid, req.params.reminderId);
      res.json(responseBuilder.success(updated, 'Reminder removed from group'));
    } catch (error) {
      logger.error('Remove reminder from group failed:', error);
      throw error;
    }
  });

  return router;
}
