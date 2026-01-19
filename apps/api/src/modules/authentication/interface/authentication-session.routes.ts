/**
 * Authentication Session Routes
 * 处理会话管理相关的 HTTP 路由
 *
 * 端点:
 * - POST /auth/refresh            - 刷新访问令牌
 * - GET  /auth/sessions           - 获取活跃会话列表
 * - DELETE /auth/sessions/:uuid   - 撤销特定会话
 * - POST /auth/logout-all         - 全设备登出
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { SessionManagementApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationSessionRoutes');
const responseBuilder = createResponseBuilder();

export function registerSessionRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     tags: [Authentication]
   *     summary: 刷新访问令牌
   *     description: 使用 refresh token 获取新的 access token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token 刷新成功
   *       401:
   *         description: Refresh token 无效或已过期
   */
  router.post('/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const result = await SessionManagementApplicationService.refreshSession(refreshToken);
      res.json(responseBuilder.success(result, 'Session refreshed successfully'));
    } catch (error) {
      logger.error('Refresh token failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/auth/sessions:
   *   get:
   *     tags: [Authentication]
   *     summary: 获取活跃会话列表
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取会话列表
   *       401:
   *         description: 未授权
   */
  router.get('/sessions', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const sessions = await SessionManagementApplicationService.getActiveSessions(
        req.user.accountUuid,
      );
      res.json(responseBuilder.success(sessions, 'Active sessions retrieved'));
    } catch (error) {
      logger.error('Get active sessions failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/auth/sessions/{sessionUuid}:
   *   delete:
   *     tags: [Authentication]
   *     summary: 撤销特定会话 (登出特定设备)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sessionUuid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 会话已撤销
   *       401:
   *         description: 未授权
   *       404:
   *         description: 会话不存在
   */
  router.delete(
    '/sessions/:sessionUuid',
    authMiddleware,
    async (req: AuthenticatedRequest, res) => {
      try {
        await SessionManagementApplicationService.revokeSession(
          req.params.sessionUuid,
          req.user.accountUuid,
        );
        res.json(responseBuilder.success(null, 'Session revoked'));
      } catch (error) {
        logger.error('Revoke session failed:', error);
        throw error;
      }
    },
  );

  /**
   * @swagger
   * /api/auth/logout-all:
   *   post:
   *     tags: [Authentication]
   *     summary: 全设备登出
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 所有设备已登出
   *       401:
   *         description: 未授权
   */
  router.post('/logout-all', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await SessionManagementApplicationService.logoutAll(req.user.accountUuid);
      res.json(responseBuilder.success(null, 'Logout all devices successful'));
    } catch (error) {
      logger.error('Logout all failed:', error);
      throw error;
    }
  });

  return router;
}
