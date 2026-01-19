/**
 * Authentication Two-Factor Authentication Routes
 * 处理双因素认证相关的 HTTP 路由
 *
 * 端点:
 * - POST /auth/two-factor/enable       - 启用双因素认证
 * - POST /auth/two-factor/disable      - 禁用双因素认证
 * - POST /auth/two-factor/verify       - 验证双因素认证代码
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { TwoFactorApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationTwoFactorRoutes');
const responseBuilder = createResponseBuilder();

export function registerTwoFactorRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/auth/two-factor/enable:
   *   post:
   *     tags: [Authentication]
   *     summary: 启用双因素认证
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - method
   *             properties:
   *               method:
   *                 type: string
   *                 enum: [TOTP, SMS, EMAIL, AUTHENTICATOR_APP]
   *     responses:
   *       200:
   *         description: 双因素认证已启用
   *       401:
   *         description: 未授权
   */
  router.post('/two-factor/enable', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { method } = req.body;
      const result = await TwoFactorApplicationService.enableTwoFactor(
        req.user.accountUuid,
        method,
      );
      res.json(responseBuilder.success(result, 'Two-factor authentication enabled'));
    } catch (error) {
      logger.error('Enable 2FA failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/auth/two-factor/disable:
   *   post:
   *     tags: [Authentication]
   *     summary: 禁用双因素认证
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 双因素认证已禁用
   *       401:
   *         description: 未授权
   */
  router.post('/two-factor/disable', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await TwoFactorApplicationService.disableTwoFactor(req.user.accountUuid);
      res.json(responseBuilder.success(null, 'Two-factor authentication disabled'));
    } catch (error) {
      logger.error('Disable 2FA failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/auth/two-factor/verify:
   *   post:
   *     tags: [Authentication]
   *     summary: 验证双因素认证代码
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - sessionUuid
   *               - code
   *             properties:
   *               sessionUuid:
   *                 type: string
   *               code:
   *                 type: string
   *                 description: 一次性验证码
   *     responses:
   *       200:
   *         description: 验证成功
   *       401:
   *         description: 验证码无效
   */
  router.post('/two-factor/verify', async (req, res) => {
    try {
      const { code, sessionUuid } = req.body;
      const result = await TwoFactorApplicationService.verify(sessionUuid, code);
      res.json(responseBuilder.success(result, 'Two-factor verification successful'));
    } catch (error) {
      logger.error('Verify 2FA failed:', error);
      throw error;
    }
  });

  return router;
}
