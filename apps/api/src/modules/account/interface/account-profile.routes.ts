/**
 * Account Profile Routes
 * 处理账户资料管理相关的 HTTP 路由
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { AccountProfileApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountProfileRoutes');
const responseBuilder = createResponseBuilder();

export function registerProfileRoutes(service: AccountProfileApplicationService): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/accounts/me:
   *   get:
   *     tags: [Accounts]
   *     summary: 获取当前用户资料
   */
  router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user || !req.user.accountUuid) {
        res.status(401).json(responseBuilder.error(401, 'Unauthorized'));
        return;
      }
      const profile = await service.getProfile(req.user.accountUuid);
      res.json(responseBuilder.success(profile, 'Profile retrieved'));
    } catch (error) {
      logger.error('Get profile failed:', error);
      res.status(500).json(responseBuilder.error(500, 'Internal Server Error'));
    }
  });

  /**
   * @swagger
   * /api/accounts/me:
   *   put:
   *     tags: [Accounts]
   *     summary: 更新当前用户资料
   */
  router.put('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await service.updateProfile({
        accountUuid: req.user.accountUuid,
        ...req.body
      });
      res.json(responseBuilder.success(result.account, result.message));
    } catch (error) {
      logger.error('Update profile failed:', error);
      res.status(400).json(responseBuilder.error(400, 'Update failed'));
    }
  });

  return router;
}
