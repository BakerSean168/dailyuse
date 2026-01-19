/**
 * Reminder Template Routes
 * 处理提醒模板的 CRUD 操作
 *
 * 端点:
 * - POST   /api/reminders/templates           - 创建模板
 * - GET    /api/reminders/templates           - 获取模板列表
 * - GET    /api/reminders/templates/:uuid     - 获取模板详情
 * - PUT    /api/reminders/templates/:uuid     - 更新模板
 * - DELETE /api/reminders/templates/:uuid     - 删除模板
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ReminderApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderTemplateRoutes');
const responseBuilder = createResponseBuilder();

export function registerReminderTemplateRoutes(): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/reminders/templates:
   *   post:
   *     tags: [Reminder Templates]
   *     summary: 创建提醒模板
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
   *               - targetType
   *               - triggerType
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               targetType:
   *                 type: string
   *                 enum: [TASK, EVENT, GOAL, HABIT, CUSTOM]
   *               triggerType:
   *                 type: string
   *                 enum: [FIXED_TIME, INTERVAL]
   *               advanceMinutes:
   *                 type: number
   *               reminderContent:
   *                 type: string
   *               isEnabled:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: 模板创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const template = await service.createTemplate(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(template, 'Template created'));
    } catch (error) {
      logger.error('Create template failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/templates:
   *   get:
   *     tags: [Reminder Templates]
   *     summary: 获取提醒模板列表
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
   *         description: 成功获取模板列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const templates = await service.getUserTemplates(req.user.accountUuid, page, limit);
      res.json(responseBuilder.success(templates, 'Templates retrieved'));
    } catch (error) {
      logger.error('Get templates failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/templates/{uuid}:
   *   get:
   *     tags: [Reminder Templates]
   *     summary: 获取提醒模板详情
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
   *         description: 成功获取模板
   *       404:
   *         description: 模板不存在
   */
  router.get('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const template = await service.getTemplate(req.params.uuid);
      res.json(responseBuilder.success(template, 'Template retrieved'));
    } catch (error) {
      logger.error('Get template failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/templates/{uuid}:
   *   put:
   *     tags: [Reminder Templates]
   *     summary: 更新提醒模板
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
   *               advanceMinutes:
   *                 type: number
   *               reminderContent:
   *                 type: string
   *               isEnabled:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: 模板更新成功
   *       404:
   *         description: 模板不存在
   */
  router.put('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      const updated = await service.updateTemplate(req.params.uuid, req.body);
      res.json(responseBuilder.success(updated, 'Template updated'));
    } catch (error) {
      logger.error('Update template failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/templates/{uuid}:
   *   delete:
   *     tags: [Reminder Templates]
   *     summary: 删除提醒模板
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
   *         description: 模板删除成功
   *       404:
   *         description: 模板不存在
   */
  router.delete('/:uuid', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ReminderApplicationService.getInstance();
      await service.deleteTemplate(req.params.uuid);
      res.json(responseBuilder.success(null, 'Template deleted'));
    } catch (error) {
      logger.error('Delete template failed:', error);
      throw error;
    }
  });

  return router;
}
