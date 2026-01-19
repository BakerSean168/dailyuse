/**
 * Authentication Login Routes
 * 处理登录、注册、登出相关的 HTTP 路由
 *
 * 端点:
 * - POST /auth/register       - 用户注册
 * - POST /auth/login          - 用户登录
 * - POST /auth/logout         - 用户登出 (单设备)
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import {
  authMiddleware,
  deviceInfoMiddleware,
} from '../../../shared/infrastructure/http/middlewares/index';
import {
  AuthenticationApplicationService,
  AccountApplicationService,
} from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AuthenticationLoginRoutes');
const responseBuilder = createResponseBuilder();

export function registerLoginRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     tags: [Authentication]
   *     summary: 用户注册
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: 用户名 (3-20 字符)
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *                 description: 密码 (至少 8 字符)
   *               profile:
   *                 type: object
   *                 properties:
   *                   displayName:
   *                     type: string
   *                   avatarUrl:
   *                     type: string
   *     responses:
   *       201:
   *         description: 注册成功
   *       400:
   *         description: 参数错误或验证失败
   *       409:
   *         description: 用户名或邮箱已存在
   */
  router.post('/register', deviceInfoMiddleware, async (req, res) => {
    try {
      const { username, email, password, profile } = req.body;
      const result = await AccountApplicationService.register({
        username,
        email,
        password,
        profile,
      });
      res.status(201).json(responseBuilder.success(result, 'Registration successful'));
    } catch (error) {
      logger.error('Register failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags: [Authentication]
   *     summary: 用户登录
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - identifier
   *               - password
   *               - deviceInfo
   *               - ipAddress
   *             properties:
   *               identifier:
   *                 type: string
   *                 description: 用户名或邮箱
   *               password:
   *                 type: string
   *               deviceInfo:
   *                 type: object
   *               ipAddress:
   *                 type: string
   *     responses:
   *       200:
   *         description: 登录成功
   *       401:
   *         description: 用户名或密码错误
   *       403:
   *         description: 账户已锁定或被禁用
   */
  router.post('/login', deviceInfoMiddleware, async (req, res) => {
    try {
      const { identifier, password, deviceInfo, ipAddress, location } = req.body;
      const result = await AuthenticationApplicationService.login({
        identifier,
        password,
        deviceInfo,
        ipAddress,
        location,
      });
      res.json(responseBuilder.success(result, 'Login successful'));
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     tags: [Authentication]
   *     summary: 用户登出 (单设备)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 登出成功
   *       401:
   *         description: 未授权
   */
  router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await AuthenticationApplicationService.logout(req.user.sessionId);
      res.json(responseBuilder.success(null, 'Logout successful'));
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  });

  return router;
}
