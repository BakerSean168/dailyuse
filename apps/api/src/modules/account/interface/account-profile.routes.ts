/**
 * Account Profile Routes
 * 处理账户资料管理相关的 HTTP 路由
 *
 * 端点:
 * - GET    /accounts/me              - 获取当前用户资料
 * - PUT    /accounts/me              - 更新当前用户资料
 * - GET    /accounts/:uuid           - 获取账户详情 (管理员)
 * - PATCH  /accounts/:uuid/profile   - 更新账户资料 (管理员)
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { AccountApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountProfileRoutes');
const responseBuilder = createResponseBuilder();

export function registerProfileRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/accounts/me:
   *   get:
   *     tags: [Accounts]
   *     summary: 获取当前用户资料
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取资料
   *       401:
   *         description: 未授权
   */
  router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const profile = await AccountApplicationService.getProfile(req.user.accountUuid);
      res.json(responseBuilder.success(profile, 'Profile retrieved'));
    } catch (error) {
      logger.error('Get profile failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/accounts/me:
   *   put:
   *     tags: [Accounts]
   *     summary: 更新当前用户资料
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               displayName:
   *                 type: string
   *               avatarUrl:
   *                 type: string
   *               bio:
   *                 type: string
   *               timezone:
   *                 type: string
   *               language:
   *                 type: string
   *     responses:
   *       200:
   *         description: 资料更新成功
   *       401:
   *         description: 未授权
   */
  router.put('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const updated = await AccountApplicationService.updateProfile(req.user.accountUuid, req.body);
      res.json(responseBuilder.success(updated, 'Profile updated'));
    } catch (error) {
      logger.error('Update profile failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/accounts/{uuid}:
   *   get:
   *     tags: [Accounts]
   *     summary: 获取账户详情 (管理员)
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 成功获取账户详情
   *       404:
   *         description: 账户不存在
   */
  router.get('/:uuid', async (req, res) => {
    try {
      const account = await AccountApplicationService.getAccount(req.params.uuid);
      if (!account) {
        return res
          .status(404)
          .json(responseBuilder.error(ResponseCode.NOT_FOUND, 'Account not found'));
      }
      res.json(responseBuilder.success(account, 'Account retrieved'));
    } catch (error) {
      logger.error('Get account failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/accounts/{uuid}/profile:
   *   patch:
   *     tags: [Accounts]
   *     summary: 更新账户资料 (管理员)
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
   *               displayName:
   *                 type: string
   *               avatarUrl:
   *                 type: string
   *               bio:
   *                 type: string
   *     responses:
   *       200:
   *         description: 资料更新成功
   *       404:
   *         description: 账户不存在
   */
  router.patch('/:uuid/profile', async (req, res) => {
    try {
      const updated = await AccountApplicationService.updateProfile(req.params.uuid, req.body);
      res.json(responseBuilder.success(updated, 'Profile updated'));
    } catch (error) {
      logger.error('Update profile failed:', error);
      throw error;
    }
  });

  return router;
}
