/**
 * Authentication Password Routes
 * 处理密码管理相关的 HTTP 路由
 *
 * 端点:
 * - POST /auth/password/change  - 修改密码
 * - POST /auth/password/forgot  - 申请密码重置
 * - POST /auth/password/reset   - 重置密码
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { AuthenticationApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationPasswordRoutes');
const responseBuilder = createResponseBuilder();

export function registerPasswordRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/auth/password/change:
   *   post:
   *     tags: [Authentication]
   *     summary: 修改密码
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 format: password
   *               newPassword:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: 密码修改成功
   *       400:
   *         description: 新密码不符合强度要求
   *       401:
   *         description: 当前密码错误
   */
  router.post('/password/change', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthenticationApplicationService.changePassword(
        req.user.accountUuid,
        currentPassword,
        newPassword,
      );
      res.json(responseBuilder.success(null, 'Password changed successfully'));
    } catch (error) {
      logger.error('Change password failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/auth/password/forgot:
   *   post:
   *     tags: [Authentication]
   *     summary: 申请密码重置
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *     responses:
   *       200:
   *         description: 密码重置邮件已发送
   *       404:
   *         description: 账户不存在
   */
  router.post('/password/forgot', async (req, res) => {
    try {
      const { email } = req.body;
      await AuthenticationApplicationService.forgotPassword(email);
      res.json(responseBuilder.success(null, 'Password reset email sent'));
    } catch (error) {
      logger.error('Forgot password failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/auth/password/reset:
   *   post:
   *     tags: [Authentication]
   *     summary: 重置密码
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *               - newPassword
   *             properties:
   *               token:
   *                 type: string
   *                 description: 密码重置令牌
   *               newPassword:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: 密码重置成功
   *       400:
   *         description: 令牌无效或已过期
   */
  router.post('/password/reset', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      await AuthenticationApplicationService.resetPassword(token, newPassword);
      res.json(responseBuilder.success(null, 'Password reset successfully'));
    } catch (error) {
      logger.error('Reset password failed:', error);
      throw error;
    }
  });

  return router;
}
