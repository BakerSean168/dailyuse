/**
 * Goal Search & Statistics Routes
 * 处理目标搜索和统计功能
 *
 * 端点:
 * - GET /goals/search          - 搜索目标
 * - GET /goals/statistics      - 获取目标统计信息
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

export function registerSearchRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/goals/search:
   *   get:
   *     tags: [Goal Search]
   *     summary: 搜索目标
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: query
   *         required: true
   *         schema:
   *           type: string
   *         description: 搜索关键词
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
   *         description: 搜索结果
   *       400:
   *         description: 搜索关键词为空或无效
   */
  router.get('/search', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { query, status, priority, limit } = req.query;
      if (!query) {
        throw new Error('Search query is required');
      }
      const goalService = await GoalApplicationService.getInstance();
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
   *     summary: 获取目标统计信息
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
   *         description: 统计信息
   *       400:
   *         description: 请求参数错误
   */
  router.get('/statistics', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { period } = req.query;
      const goalService = await GoalApplicationService.getInstance();
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
