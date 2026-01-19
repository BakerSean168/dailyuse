/**
 * Account Deletion Routes
 * 处理账户删除/注销相关的 HTTP 路由
 *
 * 端点:
 * - DELETE /accounts/me                  - 删除当前用户账户
 * - POST   /accounts                     - 创建账户 (管理员)
 * - GET    /accounts                     - 列出账户 (管理员)
 * - POST   /accounts/:uuid/deactivate    - 停用账户 (管理员)
 * - DELETE /accounts/:uuid               - 删除账户 (管理员)
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { AccountApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountDeletionRoutes');
const responseBuilder = createResponseBuilder();

export function registerDeletionRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/accounts/me:
   *   delete:
   *     tags: [Accounts]
   *     summary: 删除当前用户账户 (软删除)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - password
   *               - confirmationText
   *             properties:
   *               password:
   *                 type: string
   *                 format: password
   *                 description: 密码 (二次验证)
   *               confirmationText:
   *                 type: string
   *                 description: 确认文本 (必须为 "DELETE")
   *               reason:
   *                 type: string
   *                 description: 注销原因
   *               feedback:
   *                 type: string
   *                 description: 用户反馈
   *     responses:
   *       200:
   *         description: 账户删除成功
   *       400:
   *         description: 验证失败
   *       401:
   *         description: 密码错误或未授权
   *       409:
   *         description: 账户已被删除
   */
  router.delete('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { password, confirmationText, reason, feedback } = req.body;
      await AccountApplicationService.deleteAccount(req.user.accountUuid, {
        password,
        confirmationText,
        reason,
        feedback,
      });
      res.json(responseBuilder.success(null, 'Account deleted'));
    } catch (error) {
      logger.error('Delete account failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/accounts:
   *   post:
   *     tags: [Accounts]
   *     summary: 创建账户 (管理员)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - username
   *             properties:
   *               email:
   *                 type: string
   *               username:
   *                 type: string
   *               displayName:
   *                 type: string
   *     responses:
   *       201:
   *         description: 账户创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/', async (req, res) => {
    try {
      const account = await AccountApplicationService.createAccount(req.body);
      res.status(201).json(responseBuilder.success(account, 'Account created'));
    } catch (error) {
      logger.error('Create account failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/accounts:
   *   get:
   *     tags: [Accounts]
   *     summary: 列出账户列表 (管理员)
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 成功获取账户列表
   */
  router.get('/', async (req, res) => {
    try {
      const { page = 1, pageSize = 20, status } = req.query;
      const accounts = await AccountApplicationService.listAccounts({
        page: Number(page),
        pageSize: Number(pageSize),
        status: status as string,
      });
      res.json(responseBuilder.success(accounts, 'Accounts listed'));
    } catch (error) {
      logger.error('List accounts failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/accounts/{uuid}/deactivate:
   *   post:
   *     tags: [Accounts]
   *     summary: 停用账户 (管理员)
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 账户停用成功
   *       404:
   *         description: 账户不存在
   */
  router.post('/:uuid/deactivate', async (req, res) => {
    try {
      await AccountApplicationService.deactivateAccount(req.params.uuid);
      res.json(responseBuilder.success(null, 'Account deactivated'));
    } catch (error) {
      logger.error('Deactivate account failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/accounts/{uuid}:
   *   delete:
   *     tags: [Accounts]
   *     summary: 删除账户 (管理员)
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 账户删除成功
   *       404:
   *         description: 账户不存在
   */
  router.delete('/:uuid', async (req, res) => {
    try {
      await AccountApplicationService.deleteAccount(req.params.uuid, req.body);
      res.json(responseBuilder.success(null, 'Account deleted'));
    } catch (error) {
      logger.error('Delete account failed:', error);
      throw error;
    }
  });

  return router;
}
