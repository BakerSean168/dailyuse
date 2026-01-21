/**
 * Account Deletion Routes
 * 处理账户注销相关的 HTTP 路由
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { AccountDeletionApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AccountDeletionRoutes');
const responseBuilder = createResponseBuilder();

export function registerDeletionRoutes(service: AccountDeletionApplicationService): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/accounts/me:
   *   delete:
   *     tags: [Accounts]
   *     summary: 注销账户
   */
  router.delete('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await service.deleteAccount({
        accountUuid: req.user.accountUuid,
        ...req.body
      });
      res.json(responseBuilder.success(null, result.message));
    } catch (error) {
      logger.error('Delete account failed:', error);
      res.status(400).json(responseBuilder.error(400, 'Deletion failed'));
    }
  });

  return router;
}
