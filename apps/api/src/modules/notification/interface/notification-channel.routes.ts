/**
 * Notification Channel Routes
 * 处睆通知渠靓的酝置和管睆（Email, SMS, Push, In-App�?
 *
 * 端点:
 * - GET    /api/notifications/channels                - 获坖所有渠靓酝�?
 * - GET    /api/notifications/channels/:type          - 获坖特定渠靓酝置
 * - PUT    /api/notifications/channels/:type          - 更新渠靓酝置
 * - PATCH  /api/notifications/channels/:type/enable   - 坯用渠靓
 * - PATCH  /api/notifications/channels/:type/disable  - 禝用渠靓
 * - POST   /api/notifications/channels/:type/verify   - 验话渠靓凭话
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { NotificationChannelApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationChannelRoutes');
const responseBuilder = createResponseBuilder();

export function registerNotificationChannelRoutes(service: NotificationChannelApplicationService): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/notifications/channels:
   *   get:
   *     tags: [Notification Channels]
   *     summary: 获坖所有通知渠靓酝置
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 戝功获坖所有渠靓酝�?
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {

      const channels = await service.getUserChannels(req.user.accountUuid);
      res.json(responseBuilder.success(channels, 'Channels retrieved'));
    } catch (error) {
      logger.error('Get channels failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/channels/{type}:
   *   get:
   *     tags: [Notification Channels]
   *     summary: 获坖特定渠靓的酝�?
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [EMAIL, SMS, PUSH, IN_APP]
   *     responses:
   *       200:
   *         description: 戝功获坖渠靓酝置
   *       404:
   *         description: 渠靓丝存在或未酝�?
   */
  router.get('/:type', async (req: AuthenticatedRequest, res) => {
    try {

      const channel = await service.getChannelConfig(req.user.accountUuid, req.params.type);
      res.json(responseBuilder.success(channel, 'Channel config retrieved'));
    } catch (error) {
      logger.error('Get channel config failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/channels/{type}:
   *   put:
   *     tags: [Notification Channels]
   *     summary: 更新渠靓酝置
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [EMAIL, SMS, PUSH, IN_APP]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               emailAddress:
   *                 type: string
   *                 description: �?type=EMAIL �?
   *               phoneNumber:
   *                 type: string
   *                 description: �?type=SMS �?
   *               deviceToken:
   *                 type: string
   *                 description: �?type=PUSH �?
   *               settings:
   *                 type: object
   *               notificationPreferences:
   *                 type: object
   *     responses:
   *       200:
   *         description: 渠靓酝置已更�?
   *       404:
   *         description: 渠靓丝存�?
   */
  router.put('/:type', async (req: AuthenticatedRequest, res) => {
    try {

      const updated = await service.updateChannelConfig(
        req.user.accountUuid,
        req.params.type,
        req.body,
      );
      res.json(responseBuilder.success(updated, 'Channel config updated'));
    } catch (error) {
      logger.error('Update channel config failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/channels/{type}/enable:
   *   patch:
   *     tags: [Notification Channels]
   *     summary: 坯用通知渠靓
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [EMAIL, SMS, PUSH, IN_APP]
   *     responses:
   *       200:
   *         description: 渠靓已坯�?
   */
  router.patch('/:type/enable', async (req: AuthenticatedRequest, res) => {
    try {

      const updated = await service.enableChannel(req.user.accountUuid, req.params.type);
      res.json(responseBuilder.success(updated, 'Channel enabled'));
    } catch (error) {
      logger.error('Enable channel failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/channels/{type}/disable:
   *   patch:
   *     tags: [Notification Channels]
   *     summary: 禝用通知渠靓
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [EMAIL, SMS, PUSH, IN_APP]
   *     responses:
   *       200:
   *         description: 渠靓已禝�?
   */
  router.patch('/:type/disable', async (req: AuthenticatedRequest, res) => {
    try {

      const updated = await service.disableChannel(req.user.accountUuid, req.params.type);
      res.json(responseBuilder.success(updated, 'Channel disabled'));
    } catch (error) {
      logger.error('Disable channel failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/notifications/channels/{type}/verify:
   *   post:
   *     tags: [Notification Channels]
   *     summary: 验话通知渠靓凭话
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [EMAIL, SMS, PUSH, IN_APP]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               code:
   *                 type: string
   *                 description: 验话�?
   *               testMessage:
   *                 type: boolean
   *                 description: 是坦坑逝测试消�?
   *     responses:
   *       200:
   *         description: 渠靓验话戝功
   *       400:
   *         description: 验话失败
   */
  router.post('/:type/verify', async (req: AuthenticatedRequest, res) => {
    try {

      const result = await service.verifyChannel(
        req.user.accountUuid,
        req.params.type,
        req.body.code,
        req.body.testMessage,
      );
      res.json(responseBuilder.success(result, 'Channel verified'));
    } catch (error) {
      logger.error('Verify channel failed:', error);
      throw error;
    }
  });

  return router;
}
