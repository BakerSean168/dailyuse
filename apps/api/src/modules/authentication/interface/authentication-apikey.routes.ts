/**
 * Authentication API Key Routes
 * 处理 API 密钥管理相关的 HTTP 路由
 *
 * 端点:
 * - POST /auth/api-keys           - 生成新 API 密钥
 * - GET  /auth/api-keys           - 列出所有 API 密钥
 * - DELETE /auth/api-keys/:keyId  - 撤销 API 密钥
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ApiKeyApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationApiKeyRoutes');
const responseBuilder = createResponseBuilder();

export function registerApiKeyRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/auth/api-keys:
   *   post:
   *     tags: [Authentication]
   *     summary: 生成新 API 密钥
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
   *             properties:
   *               name:
   *                 type: string
   *                 description: API 密钥名称
   *               expiresInDays:
   *                 type: integer
   *                 description: 过期时间 (天数)
   *     responses:
   *       201:
   *         description: API 密钥生成成功
   *       401:
   *         description: 未授权
   */
  router.post('/api-keys', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { name, expiresInDays } = req.body;
      const result = await ApiKeyApplicationService.generateApiKey(
        req.user.accountUuid,
        name,
        expiresInDays,
      );
      res.status(201).json(responseBuilder.success(result, 'API key generated'));
    } catch (error) {
      logger.error('Generate API key failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/auth/api-keys:
   *   get:
   *     tags: [Authentication]
   *     summary: 列出所有 API 密钥
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取 API 密钥列表
   *       401:
   *         description: 未授权
   */
  router.get('/api-keys', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const keys = await ApiKeyApplicationService.listApiKeys(req.user.accountUuid);
      res.json(responseBuilder.success(keys, 'API keys retrieved'));
    } catch (error) {
      logger.error('List API keys failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/auth/api-keys/{keyId}:
   *   delete:
   *     tags: [Authentication]
   *     summary: 撤销 API 密钥
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: keyId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: API 密钥已撤销
   *       401:
   *         description: 未授权
   *       404:
   *         description: 密钥不存在
   */
  router.delete('/api-keys/:keyId', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await ApiKeyApplicationService.revokeApiKey(req.params.keyId, req.user.accountUuid);
      res.json(responseBuilder.success(null, 'API key revoked'));
    } catch (error) {
      logger.error('Revoke API key failed:', error);
      throw error;
    }
  });

  return router;
}
