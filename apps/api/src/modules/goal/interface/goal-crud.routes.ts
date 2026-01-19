/**
 * Goal CRUD Routes
 * 处理目标的基本 CRUD 操作 (创建、读取、更新、删除)
 *
 * 端点:
 * - GET  /goals                  - 获取当前用户所有目标
 * - POST /goals                  - 创建目标
 * - GET  /goals/:uuid            - 获取目标详情
 * - PUT  /goals/:uuid            - 更新目标
 * - DELETE /goals/:uuid          - 删除目标
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { GoalApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalCrudRoutes');
const responseBuilder = createResponseBuilder();

export function registerCrudRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/goals:
   *   get:
   *     tags: [Goals]
   *     summary: 获取当前用户所有目标
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: includeChildren
   *         schema:
   *           type: boolean
   *           default: false
   *     responses:
   *       200:
   *         description: 成功获取目标列表
   */
  router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { limit, page, includeChildren } = req.query;
      const goalService = await GoalApplicationService.getInstance();
      const goals = await goalService.getUserGoals(req.user.accountUuid, {
        limit: Number(limit) || 100,
        page: Number(page) || 1,
        includeChildren: includeChildren === 'true',
      });
      res.json(responseBuilder.success(goals, 'Goals retrieved'));
    } catch (error) {
      logger.error('Get goals failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals:
   *   post:
   *     tags: [Goals]
   *     summary: 创建目标
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               targetDate:
   *                 type: string
   *                 format: date-time
   *               priority:
   *                 type: string
   *                 enum: [low, medium, high]
   *     responses:
   *       201:
   *         description: 目标创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goalService = await GoalApplicationService.getInstance();
      const goal = await goalService.createGoal({
        accountUuid: req.user.accountUuid,
        ...req.body,
      });
      res.status(201).json(responseBuilder.success(goal, 'Goal created'));
    } catch (error) {
      logger.error('Create goal failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{uuid}:
   *   get:
   *     tags: [Goals]
   *     summary: 获取目标详情
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 成功获取目标详情
   *       404:
   *         description: 目标不存在
   */
  router.get('/:uuid', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goalService = await GoalApplicationService.getInstance();
      const goal = await goalService.getGoal(req.params.uuid);
      if (!goal) {
        return res
          .status(404)
          .json(responseBuilder.error(ResponseCode.NOT_FOUND, 'Goal not found'));
      }
      res.json(responseBuilder.success(goal, 'Goal retrieved'));
    } catch (error) {
      logger.error('Get goal failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{uuid}:
   *   put:
   *     tags: [Goals]
   *     summary: 更新目标
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               targetDate:
   *                 type: string
   *                 format: date-time
   *               priority:
   *                 type: string
   *     responses:
   *       200:
   *         description: 目标更新成功
   *       404:
   *         description: 目标不存在
   */
  router.put('/:uuid', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goalService = await GoalApplicationService.getInstance();
      const updated = await goalService.updateGoal(req.params.uuid, req.body);
      res.json(responseBuilder.success(updated, 'Goal updated'));
    } catch (error) {
      logger.error('Update goal failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{uuid}:
   *   delete:
   *     tags: [Goals]
   *     summary: 删除目标
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 目标删除成功
   *       404:
   *         description: 目标不存在
   */
  router.delete('/:uuid', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goalService = await GoalApplicationService.getInstance();
      await goalService.deleteGoal(req.params.uuid);
      res.json(responseBuilder.success(null, 'Goal deleted'));
    } catch (error) {
      logger.error('Delete goal failed:', error);
      throw error;
    }
  });

  return router;
}
