/**
 * Goal Key Result Routes
 * 处理关键结果 (Key Result) 的管理
 *
 * 端点:
 * - POST   /goals/:goalUuid/key-results            - 创建关键结果
 * - GET    /goals/:goalUuid/key-results            - 获取关键结果列表
 * - PUT    /goals/:goalUuid/key-results/:krUuid    - 更新关键结果
 * - DELETE /goals/:goalUuid/key-results/:krUuid    - 删除关键结果
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { GoalKeyResultApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalKeyResultRoutes');
const responseBuilder = createResponseBuilder();

export function registerKeyResultRoutes(): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/goals/{goalUuid}/key-results:
   *   post:
   *     tags: [Goal Key Results]
   *     summary: 创建关键结果
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
   *               - title
   *               - targetValue
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               targetValue:
   *                 type: number
   *               unit:
   *                 type: string
   *               weight:
   *                 type: number
   *     responses:
   *       201:
   *         description: 关键结果创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/:goalUuid/key-results', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const krService = await GoalKeyResultApplicationService.getInstance();
      const kr = await krService.createKeyResult(req.params.goalUuid, req.body);
      res.status(201).json(responseBuilder.success(kr, 'Key result created'));
    } catch (error) {
      logger.error('Create key result failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{goalUuid}/key-results:
   *   get:
   *     tags: [Goal Key Results]
   *     summary: 获取关键结果列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: goalUuid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 成功获取关键结果列表
   */
  router.get('/:goalUuid/key-results', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const krService = await GoalKeyResultApplicationService.getInstance();
      const krs = await krService.getKeyResultsByGoal(req.params.goalUuid);
      res.json(responseBuilder.success(krs, 'Key results retrieved'));
    } catch (error) {
      logger.error('Get key results failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{goalUuid}/key-results/{krUuid}:
   *   put:
   *     tags: [Goal Key Results]
   *     summary: 更新关键结果
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: goalUuid
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: krUuid
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
   *               targetValue:
   *                 type: number
   *               currentValue:
   *                 type: number
   *               weight:
   *                 type: number
   *     responses:
   *       200:
   *         description: 关键结果更新成功
   */
  router.put(
    '/:goalUuid/key-results/:krUuid',
    authMiddleware,
    async (req: AuthenticatedRequest, res) => {
      try {
        const krService = await GoalKeyResultApplicationService.getInstance();
        const updated = await krService.updateKeyResult(req.params.krUuid, req.body);
        res.json(responseBuilder.success(updated, 'Key result updated'));
      } catch (error) {
        logger.error('Update key result failed:', error);
        throw error;
      }
    },
  );

  /**
   * @swagger
   * /api/goals/{goalUuid}/key-results/{krUuid}:
   *   delete:
   *     tags: [Goal Key Results]
   *     summary: 删除关键结果
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: goalUuid
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: krUuid
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 关键结果删除成功
   */
  router.delete(
    '/:goalUuid/key-results/:krUuid',
    authMiddleware,
    async (req: AuthenticatedRequest, res) => {
      try {
        const krService = await GoalKeyResultApplicationService.getInstance();
        await krService.deleteKeyResult(req.params.krUuid);
        res.json(responseBuilder.success(null, 'Key result deleted'));
      } catch (error) {
        logger.error('Delete key result failed:', error);
        throw error;
      }
    },
  );

  return router;
}
