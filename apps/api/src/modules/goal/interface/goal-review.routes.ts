/**
 * Goal Review Routes
 * 处理目标评审
 *
 * 端点:
 * - POST /goals/:goalUuid/reviews    - 创建评审
 * - GET  /goals/:goalUuid/reviews    - 获取评审列表
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { GoalReviewApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalReviewRoutes');
const responseBuilder = createResponseBuilder();

export function registerReviewRoutes(service: GoalReviewApplicationService): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/goals/{goalUuid}/reviews:
   *   post:
   *     tags: [Goal Reviews]
   *     summary: 创建目标评审
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: goalUuid
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [on_track, at_risk, off_track]
   *               completionPercentage:
   *                 type: number
   *               summary:
   *                 type: string
   *               successCriteria:
   *                 type: string
   *               blockers:
   *                 type: array
   *                 items:
   *                   type: string
   *               nextActions:
   *                 type: array
   *                 items:
   *                   type: string
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: 评审创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/:goalUuid/reviews', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const reviewService = await GoalReviewApplicationService.getInstance();
      const review = await reviewService.createReview(req.params.goalUuid, req.body);
      res.status(201).json(responseBuilder.success(review, 'Review created'));
    } catch (error) {
      logger.error('Create review failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{goalUuid}/reviews:
   *   get:
   *     tags: [Goal Reviews]
   *     summary: 获取目标评审列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: goalUuid
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *     responses:
   *       200:
   *         description: 成功获取评审列表
   */
  router.get('/:goalUuid/reviews', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const reviewService = await GoalReviewApplicationService.getInstance();
      const reviews = await reviewService.getReviewsByGoal(req.params.goalUuid, {
        limit: Number(req.query.limit) || 20,
        offset: Number(req.query.offset) || 0,
      });
      res.json(responseBuilder.success(reviews, 'Reviews retrieved'));
    } catch (error) {
      logger.error('Get reviews failed:', error);
      throw error;
    }
  });

  return router;
}
