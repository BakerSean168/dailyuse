/**
 * Notification Template Routes
 * 处睆通知模板的管睆和自定�?
 *
 * 端点:
 * - POST   /api/notifications/templates           - 创建模板
 * - GET    /api/notifications/templates           - 获坖模板列表
 * - GET    /api/notifications/templates/:id       - 获坖模板详情
 * - PUT    /api/notifications/templates/:id       - 更新模板
 * - DELETE /api/notifications/templates/:id       - 删除模板
 * - POST   /api/notifications/templates/:id/preview - 预览模板
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { NotificationTemplateApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationTemplateRoutes');
const responseBuilder = createResponseBuilder();

export function registerNotificationTemplateRoutes(service: NotificationTemplateApplicationService): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/notifications/templates:
   *   post:
   *     tags: [Notification Templates]
   *     summary: 创建通知模板
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
   *               - channels
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               channels:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [EMAIL, SMS, PUSH, IN_APP]
   *               templates:
   *                 type: object
   *                 properties:
   *                   EMAIL:
   *                     type: object
   *                     properties:
   *                       subject:
   *                         type: string
   *                       body:
   *                         type: string
   *                   SMS:
   *                     type: object
   *                     properties:
   *                       message:
   *                         type: string
   *                   PUSH:
   *                     type: object
   *                     properties:
   *                       title:
   *                         type: string
   *                       body:
   *                         type: string
   *                       icon:
   *                         type: string
   *                   IN_APP:
   *                     type: object
   *                     properties:
   *                       title:
   *                         type: string
   *                       content:
   *                         type: string
   *               variables:
   *                 type: array
   *                 items:
   *                   type: string
   *               category:
   *                 type: string
   *     responses:
   *       201:
   *         description: 模板创建戝功
   *       400:
   *         description: 请求坂数错误
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {

      const template = await service.createTemplate(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(template, 'Template created'));
    } catch (error) {
      logger.error('Create template failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/templates:
   *   get:
   *     tags: [Notification Templates]
   *     summary: 获坖通知模板列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
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
   *         description: 戝功获坖模板列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const category = req.query.category as string;

      const templates = await service.getUserTemplates(
        req.user.accountUuid,
        { category },
        page,
        limit,
      );
      res.json(responseBuilder.success(templates, 'Templates retrieved'));
    } catch (error) {
      logger.error('Get templates failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/templates/{id}:
   *   get:
   *     tags: [Notification Templates]
   *     summary: 获坖模板详情
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
   *         description: 戝功获坖模板
   *       404:
   *         description: 模板丝存�?
   */
  router.get('/:id', async (req: AuthenticatedRequest, res) => {
    try {

      const template = await service.getTemplate(req.params.id);
      res.json(responseBuilder.success(template, 'Template retrieved'));
    } catch (error) {
      logger.error('Get template failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/templates/{id}:
   *   put:
   *     tags: [Notification Templates]
   *     summary: 更新模板
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
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               templates:
   *                 type: object
   *               variables:
   *                 type: array
   *               category:
   *                 type: string
   *     responses:
   *       200:
   *         description: 模板更新戝功
   *       404:
   *         description: 模板丝存�?
   */
  router.put('/:id', async (req: AuthenticatedRequest, res) => {
    try {

      const updated = await service.updateTemplate(req.params.id, req.body);
      res.json(responseBuilder.success(updated, 'Template updated'));
    } catch (error) {
      logger.error('Update template failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/templates/{id}:
   *   delete:
   *     tags: [Notification Templates]
   *     summary: 删除模板
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
   *         description: 模板删除戝功
   *       404:
   *         description: 模板丝存�?
   */
  router.delete('/:id', async (req: AuthenticatedRequest, res) => {
    try {

      await service.deleteTemplate(req.params.id);
      res.json(responseBuilder.success(null, 'Template deleted'));
    } catch (error) {
      logger.error('Delete template failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/templates/{id}/preview:
   *   post:
   *     tags: [Notification Templates]
   *     summary: 预览模板
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
   *               channel:
   *                 type: string
   *                 enum: [EMAIL, SMS, PUSH, IN_APP]
   *               variables:
   *                 type: object
   *     responses:
   *       200:
   *         description: 预览戝功
   */
  router.post('/:id/preview', async (req: AuthenticatedRequest, res) => {
    try {

      const preview = await service.previewTemplate(
        req.params.id,
        req.body.channel,
        req.body.variables,
      );
      res.json(responseBuilder.success(preview, 'Template preview'));
    } catch (error) {
      logger.error('Preview template failed:', error);
      throw error;
    }
  });

  return router;
}
