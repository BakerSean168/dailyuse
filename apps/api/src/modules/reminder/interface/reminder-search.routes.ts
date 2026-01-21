/**
 * Reminder Search & Analytics Routes
 * 处理提醒的搜索、查询和统计功能
 *
 * 端点:
 * - GET /api/reminders/search/query - 搜索提醒
 * - GET /api/reminders/analytics/statistics - 获取统计数据
 * - GET /api/reminders/analytics/upcoming - 获取即将到来的提醒
 * - GET /api/reminders/analytics/missed - 获取错过的提醒
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { 
  ReminderApplicationService,
  ReminderQueryApplicationService,
  ReminderStatisticsApplicationService
} from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ReminderSearchAnalyticsRoutes');
const responseBuilder = createResponseBuilder();

export function registerReminderSearchAnalyticsRoutes(
  service: ReminderApplicationService,
  statisticsService: ReminderStatisticsApplicationService,
  queryService: ReminderQueryApplicationService
): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/reminders/search/query:
   *   get:
   *     tags: [Reminder Search]
   *     summary: 搜索提醒
   * ...
   */
  router.get('/search/query', async (req: AuthenticatedRequest, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = ((req.query.sortOrder as string) || 'desc') as 'asc' | 'desc';

      let filters: Record<string, unknown> = {};
      if (req.query.filters) {
        try {
          filters = JSON.parse(req.query.filters as string);
        } catch (e) {
          logger.warn('Invalid filters JSON:', req.query.filters);
        }
      }

      // Use queryService
      // @ts-ignore
      const results = await queryService.searchReminders(
        req.user.accountUuid,
        req.query.q as string,
        filters,
        page,
        limit,
        sortBy,
        sortOrder,
      );
      res.json(responseBuilder.success(results, 'Search completed'));
    } catch (error) {
      logger.error('Search reminders failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/analytics/statistics:
   *   get:
   *     tags: [Reminder Analytics]
   *     summary: 获取提醒统计数据
   * ...
   */
  router.get('/analytics/statistics', async (req: AuthenticatedRequest, res) => {
    try {
      const dateRange = (req.query.dateRange as string) || 'month';
      const groupBy = (req.query.groupBy as string) || 'day';

      // Use statisticsService
      // @ts-ignore
      const stats = await statisticsService.getStatistics(req.user.accountUuid, dateRange, groupBy);
      res.json(responseBuilder.success(stats, 'Statistics retrieved'));
    } catch (error) {
      logger.error('Get statistics failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/analytics/upcoming:
   *   get:
   *     tags: [Reminder Analytics]
   *     summary: 获取即将到来的提醒
   * ...
   */
  router.get('/analytics/upcoming', async (req: AuthenticatedRequest, res) => {
    try {
      const days = Number(req.query.days) || 7;
      const limit = Number(req.query.limit) || 50;

      // Use queryService
      // @ts-ignore
      const upcoming = await queryService.getUpcomingReminders(req.user.accountUuid, days, limit);
      res.json(responseBuilder.success(upcoming, 'Upcoming reminders retrieved'));
    } catch (error) {
      logger.error('Get upcoming reminders failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/reminders/analytics/missed:
   *   get:
   *     tags: [Reminder Analytics]
   *     summary: 获取错过的提醒
   * ...
   */
  router.get('/analytics/missed', async (req: AuthenticatedRequest, res) => {
    try {
      const days = Number(req.query.days) || 30;
      const limit = Number(req.query.limit) || 50;
      const page = Number(req.query.page) || 1;

      // Use queryService
      // @ts-ignore
      const missed = await queryService.getMissedReminders(req.user.accountUuid, days, page, limit);
      res.json(responseBuilder.success(missed, 'Missed reminders retrieved'));
    } catch (error) {
      logger.error('Get missed reminders failed:', error);
      throw error;
    }
  });

  return router;
}
