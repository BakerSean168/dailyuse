/**
 * Goal Status Routes
 * 处理目标状态变更操作 (完成、归档、激活)
 *
 * 端点:
 * - POST /goals/:uuid/complete  - 完成目标
 * - POST /goals/:uuid/archive   - 归档目标
 * - POST /goals/:uuid/activate  - 激活目标
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { GoalApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalStatusRoutes');
const responseBuilder = createResponseBuilder();

export function registerStatusRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/goals/{uuid}/complete:
   *   post:
   *     tags: [Goals]
   *     summary: 完成目标
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notes:
   *                 type: string
   *                 description: 完成备注
   *     responses:
   *       200:
   *         description: 目标完成成功
   *       404:
   *         description: 目标不存在
   */
  router.post('/:uuid/complete', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goalService = await GoalApplicationService.getInstance();
      const goal = await goalService.completeGoal(req.params.uuid, req.body);
      res.json(responseBuilder.success(goal, 'Goal completed'));
    } catch (error) {
      logger.error('Complete goal failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{uuid}/archive:
   *   post:
   *     tags: [Goals]
   *     summary: 归档目标
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 description: 归档原因
   *     responses:
   *       200:
   *         description: 目标归档成功
   *       404:
   *         description: 目标不存在
   */
  router.post('/:uuid/archive', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goalService = await GoalApplicationService.getInstance();
      const goal = await goalService.archiveGoal(req.params.uuid, req.body);
      res.json(responseBuilder.success(goal, 'Goal archived'));
    } catch (error) {
      logger.error('Archive goal failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{uuid}/activate:
   *   post:
   *     tags: [Goals]
   *     summary: 激活目标
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: uuid
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reactivationReason:
   *                 type: string
   *                 description: 重新激活原因
   *     responses:
   *       200:
   *         description: 目标激活成功
   *       404:
   *         description: 目标不存在
   */
  router.post('/:uuid/activate', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goalService = await GoalApplicationService.getInstance();
      const goal = await goalService.activateGoal(req.params.uuid, req.body);
      res.json(responseBuilder.success(goal, 'Goal activated'));
    } catch (error) {
      logger.error('Activate goal failed:', error);
      throw error;
    }
  });

  return router;
}
