/**
 * Goal Search & Statistics Routes
 * 处睆目标杜索和统计功�?
 *
 * 端点:
 * - GET /goals/search          - 杜索目标
 * - GET /goals/statistics      - 获坖目标统计信杯
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { GoalApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalSearchRoutes');
const responseBuilder = createResponseBuilder();

export function registerSearchRoutes(goalService: GoalApplicationService): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/goals/search:
   *   get:
   *     tags: [Goal Search]
   *     summary: 杜索目标
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: query
   *         required: true
   *         schema:
   *           type: string
   *         description: 杜索关键�?
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, completed, archived]
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *           enum: [low, medium, high]
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: 杜索结果
   *       400:
   *         description: 杜索关键话为空或无效
   */
  router.get('/search', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { query, status, priority, limit } = req.query;
      if (!query) {
        throw new Error('Search query is required');
      }

      const results = await goalService.searchGoals(req.user.accountUuid, query as string, {
        status: status as string,
        priority: priority as string,
        limit: Number(limit) || 50,
      });
      res.json(responseBuilder.success(results, 'Search results'));
    } catch (error) {
      logger.error('Search goals failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/statistics:
   *   get:
   *     tags: [Goal Statistics]
   *     summary: 获坖目标统计信杯
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [week, month, quarter, year]
   *           default: month
   *     responses:
   *       200:
   *         description: 统计信杯
   *       400:
   *         description: 请求坂数错误
   */
  router.get('/statistics', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { period } = req.query;

      const stats = await goalService.getGoalStatistics(req.user.accountUuid, {
        period: (period as string) || 'month',
      });
      res.json(responseBuilder.success(stats, 'Statistics retrieved'));
    } catch (error) {
      logger.error('Get statistics failed:', error);
      throw error;
    }
  });

  return router;
}
