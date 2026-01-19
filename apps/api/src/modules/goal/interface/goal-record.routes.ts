/**
 * Goal Record Routes
 * 处理目标进展记录 (Goal Record / Progress)
 *
 * 端点:
 * - POST /goals/:goalUuid/records    - 创建进展记录
 * - GET  /goals/:goalUuid/records    - 获取进展记录列表
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { GoalRecordApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalRecordRoutes');
const responseBuilder = createResponseBuilder();

export function registerRecordRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/goals/{goalUuid}/records:
   *   post:
   *     tags: [Goal Records]
   *     summary: 创建目标进展记录
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
   *               - progress
   *             properties:
   *               progress:
   *                 type: number
   *                 description: 进度百分比或数值
   *               notes:
   *                 type: string
   *                 description: 进展备注
   *               achievements:
   *                 type: array
   *                 items:
   *                   type: string
   *               challenges:
   *                 type: array
   *                 items:
   *                   type: string
   *               nextSteps:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: 进展记录创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/:goalUuid/records', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const recordService = await GoalRecordApplicationService.getInstance();
      const record = await recordService.createRecord(req.params.goalUuid, req.body);
      res.status(201).json(responseBuilder.success(record, 'Record created'));
    } catch (error) {
      logger.error('Create record failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{goalUuid}/records:
   *   get:
   *     tags: [Goal Records]
   *     summary: 获取目标进展记录列表
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
   *           default: 50
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *     responses:
   *       200:
   *         description: 成功获取进展记录列表
   */
  router.get('/:goalUuid/records', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const recordService = await GoalRecordApplicationService.getInstance();
      const records = await recordService.getRecordsByGoal(req.params.goalUuid, {
        limit: Number(req.query.limit) || 50,
        offset: Number(req.query.offset) || 0,
      });
      res.json(responseBuilder.success(records, 'Records retrieved'));
    } catch (error) {
      logger.error('Get records failed:', error);
      throw error;
    }
  });

  return router;
}
