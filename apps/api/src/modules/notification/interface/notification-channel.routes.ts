/**
 * Notification Channel Routes
 * 处理通知渠道的配置和管理（Email, SMS, Push, In-App）
 *
 * 端点:
 * - GET    /api/notifications/channels                - 获取所有渠道配置
 * - GET    /api/notifications/channels/:type          - 获取特定渠道配置
 * - PUT    /api/notifications/channels/:type          - 更新渠道配置
 * - PATCH  /api/notifications/channels/:type/enable   - 启用渠道
 * - PATCH  /api/notifications/channels/:type/disable  - 禁用渠道
 * - POST   /api/notifications/channels/:type/verify   - 验证渠道凭证
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

export function registerNotificationChannelRoutes(): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/notifications/channels:
   *   get:
   *     tags: [Notification Channels]
   *     summary: 获取所有通知渠道配置
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取所有渠道配置
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await NotificationChannelApplicationService.getInstance();
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
   *     summary: 获取特定渠道的配置
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
   *         description: 成功获取渠道配置
   *       404:
   *         description: 渠道不存在或未配置
   */
  router.get('/:type', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await NotificationChannelApplicationService.getInstance();
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
   *     summary: 更新渠道配置
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
   *                 description: 当 type=EMAIL 时
   *               phoneNumber:
   *                 type: string
   *                 description: 当 type=SMS 时
   *               deviceToken:
   *                 type: string
   *                 description: 当 type=PUSH 时
   *               settings:
   *                 type: object
   *               notificationPreferences:
   *                 type: object
   *     responses:
   *       200:
   *         description: 渠道配置已更新
   *       404:
   *         description: 渠道不存在
   */
  router.put('/:type', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await NotificationChannelApplicationService.getInstance();
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
   *     summary: 启用通知渠道
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
   *         description: 渠道已启用
   */
  router.patch('/:type/enable', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await NotificationChannelApplicationService.getInstance();
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
   *     summary: 禁用通知渠道
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
   *         description: 渠道已禁用
   */
  router.patch('/:type/disable', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await NotificationChannelApplicationService.getInstance();
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
   *     summary: 验证通知渠道凭证
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
   *                 description: 验证码
   *               testMessage:
   *                 type: boolean
   *                 description: 是否发送测试消息
   *     responses:
   *       200:
   *         description: 渠道验证成功
   *       400:
   *         description: 验证失败
   */
  router.post('/:type/verify', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await NotificationChannelApplicationService.getInstance();
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
