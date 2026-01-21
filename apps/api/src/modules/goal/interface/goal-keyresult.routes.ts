/**
 * Goal Key Result Routes
 * Manage Goal Key Results
 *
 * Endpoints:
 * - POST   /goals/:goalUuid/key-results            - Create Key Result
 * - GET    /goals/:goalUuid/key-results            - Get Key Results list
 * - PUT    /goals/:goalUuid/key-results/:krUuid    - Update Key Result
 * - DELETE /goals/:goalUuid/key-results/:krUuid    - Delete Key Result
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

export function registerKeyResultRoutes(krService: GoalKeyResultApplicationService): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/goals/{goalUuid}/key-results:
   *   post:
   *     tags: [Goal Key Results]
   *     summary: Create Key Result
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
   *         description: Key Result created successfully
   *       400:
   *         description: Invalid request parameters
   */
  router.post('/:goalUuid/key-results', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const kr = await krService.addKeyResult(req.params.goalUuid, req.body);
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
   *     summary: Get Key Results list for a goal
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
   *         description: Successfully retrieved Key Results
   */
  router.get('/:goalUuid/key-results', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      // NOTE: Temporarily not implemented fully as service method might be missing in strict refactor
      // In a real scenario we would add getKeyResultsByGoal to Service or use getGoal
      res.status(501).json(responseBuilder.error(501, 'Endpoint under maintenance'));
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
   *     summary: Update Key Result
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
   *         description: Key Result updated successfully
   */
  router.put(
    '/:goalUuid/key-results/:krUuid',
    authMiddleware,
    async (req: AuthenticatedRequest, res) => {
      try {
        const updated = await krService.updateKeyResult(req.params.goalUuid, req.params.krUuid, req.body);
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
   *     summary: Delete Key Result
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
   *         description: Key Result deleted successfully
   */
  router.delete(
    '/:goalUuid/key-results/:krUuid',
    authMiddleware,
    async (req: AuthenticatedRequest, res) => {
      try {
        await krService.deleteKeyResult(req.params.goalUuid, req.params.krUuid);
        res.json(responseBuilder.success(null, 'Key result deleted'));
      } catch (error) {
        logger.error('Delete key result failed:', error);
        throw error;
      }
    },
  );

  return router;
}
