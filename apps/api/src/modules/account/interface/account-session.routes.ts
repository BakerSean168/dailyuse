/**
 * Account Session Routes
 * 处理账户会话相关的 HTTP 路由
 *
 * 端点:
 * - GET    /accounts/me/sessions                  - 获取当前用户活跃会话
 * - DELETE /accounts/me/sessions/:sessionUuid     - 撤销特定会话
 * - POST   /accounts/me/sessions/revoke-others    - 撤销所有其他设备会话
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { AccountApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountSessionRoutes');
const responseBuilder = createResponseBuilder();

export function registerSessionRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/accounts/me/sessions:
   *   get:
   *     tags: [Accounts]
   *     summary: 获取当前用户的活跃会话
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取会话列表
   *       401:
   *         description: 未授权
   */
  router.get('/me/sessions', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const sessions = await AccountApplicationService.getActiveSessions(req.user.accountUuid);
      res.json(responseBuilder.success(sessions, 'Sessions retrieved'));
    } catch (error) {
      logger.error('Get sessions failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/accounts/me/sessions/{sessionUuid}:
   *   delete:
   *     tags: [Accounts]
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
   *         description: 未授权或无权撤销此会话
   *       404:
   *         description: 会话不存在
   */
  router.delete(
    '/me/sessions/:sessionUuid',
    authMiddleware,
    async (req: AuthenticatedRequest, res) => {
      try {
        await AccountApplicationService.revokeSession(req.params.sessionUuid, req.user.accountUuid);
        res.json(responseBuilder.success(null, 'Session revoked'));
      } catch (error) {
        logger.error('Revoke session failed:', error);
        throw error;
      }
    },
  );

  /**
   * @swagger
   * /api/accounts/me/sessions/revoke-others:
   *   post:
   *     tags: [Accounts]
   *     summary: 撤销所有其他设备的会话
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功撤销所有其他会话
   *       401:
   *         description: 未授权
   */
  router.post(
    '/me/sessions/revoke-others',
    authMiddleware,
    async (req: AuthenticatedRequest, res) => {
      try {
        await AccountApplicationService.revokeOtherSessions(
          req.user.accountUuid,
          req.user.sessionId,
        );
        res.json(responseBuilder.success(null, 'Other sessions revoked'));
      } catch (error) {
        logger.error('Revoke other sessions failed:', error);
        throw error;
      }
    },
  );

  return router;
}
