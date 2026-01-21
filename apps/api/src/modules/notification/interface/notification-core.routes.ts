/**
 * Notification Core Routes
 * 处睆通知的基础 CRUD 擝作
 *
 * 端点:
 * - POST   /api/notifications           - 创建通知
 * - GET    /api/notifications           - 获坖通知列表
 * - GET    /api/notifications/:id       - 获坖通知详情
 * - PUT    /api/notifications/:id       - 更新通知
 * - DELETE /api/notifications/:id       - 删除通知
 * - PATCH  /api/notifications/:id/read  - 标记为已�?
 * - POST   /api/notifications/batch/read - 批針标记已读
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { NotificationApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationCoreRoutes');
const responseBuilder = createResponseBuilder();

export function registerNotificationCoreRoutes(service: NotificationApplicationService): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/notifications:
   *   post:
   *     tags: [Notifications]
   *     summary: 创建通知
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
   *               - content
   *               - type
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [INFO, WARNING, ERROR, SUCCESS, CUSTOM]
   *               priority:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *               actionUrl:
   *                 type: string
   *               data:
   *                 type: object
   *               expiresAt:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       201:
   *         description: 通知创建戝功
   *       400:
   *         description: 请求坂数错误
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {

      const notification = await service.createNotification(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(notification, 'Notification created'));
    } catch (error) {
      logger.error('Create notification failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     tags: [Notifications]
   *     summary: 获坖通知列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *       - in: query
   *         name: isRead
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
   *         description: 戝功获坖通知列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const filters = {
        type: req.query.type as string,
        isRead: req.query.isRead === 'true' || req.query.isRead === '1',
      };
      const notifications = await service.getUserNotifications(
        req.user.accountUuid,
        filters,
        page,
        limit,
      );
      res.json(responseBuilder.success(notifications, 'Notifications retrieved'));
    } catch (error) {
      logger.error('Get notifications failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/{id}:
   *   get:
   *     tags: [Notifications]
   *     summary: 获坖通知详情
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
   *         description: 戝功获坖通知
   *       404:
   *         description: 通知丝存�?
   */
  router.get('/:id', async (req: AuthenticatedRequest, res) => {
    try {

      const notification = await service.getNotification(req.params.id);
      res.json(responseBuilder.success(notification, 'Notification retrieved'));
    } catch (error) {
      logger.error('Get notification failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/{id}:
   *   put:
   *     tags: [Notifications]
   *     summary: 更新通知
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
   *               content:
   *                 type: string
   *               priority:
   *                 type: integer
   *               actionUrl:
   *                 type: string
   *               expiresAt:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: 通知更新戝功
   *       404:
   *         description: 通知丝存�?
   */
  router.put('/:id', async (req: AuthenticatedRequest, res) => {
    try {

      const updated = await service.updateNotification(req.params.id, req.body);
      res.json(responseBuilder.success(updated, 'Notification updated'));
    } catch (error) {
      logger.error('Update notification failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/{id}:
   *   delete:
   *     tags: [Notifications]
   *     summary: 删除通知
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
   *         description: 通知删除戝功
   *       404:
   *         description: 通知丝存�?
   */
  router.delete('/:id', async (req: AuthenticatedRequest, res) => {
    try {

      await service.deleteNotification(req.params.id);
      res.json(responseBuilder.success(null, 'Notification deleted'));
    } catch (error) {
      logger.error('Delete notification failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/{id}/read:
   *   patch:
   *     tags: [Notifications]
   *     summary: 标记通知为已�?
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
   *         description: 通知已标记为已读
   *       404:
   *         description: 通知丝存�?
   */
  router.patch('/:id/read', async (req: AuthenticatedRequest, res) => {
    try {

      const updated = await service.markAsRead(req.params.id);
      res.json(responseBuilder.success(updated, 'Notification marked as read'));
    } catch (error) {
      logger.error('Mark as read failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/batch/read:
   *   post:
   *     tags: [Notifications]
   *     summary: 批針标记通知为已�?
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - ids
   *             properties:
   *               ids:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: 通知已批針标记为已读
   */
  router.post('/batch/read', async (req: AuthenticatedRequest, res) => {
    try {

      const result = await service.markBatchAsRead(req.body.ids);
      res.json(responseBuilder.success(result, 'Notifications marked as read'));
    } catch (error) {
      logger.error('Batch mark as read failed:', error);
      throw error;
    }
  });

  return router;
}
