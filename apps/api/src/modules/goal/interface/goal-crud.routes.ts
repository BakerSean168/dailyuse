/**
 * Goal CRUD Admin Routes
 * Manage Goals (Create, Read, Update, Delete)
 *
 * Endpoints:
 * - POST   /goals               - Create Goal
 * - GET    /goals               - List Goals (with filters)
 * - GET    /goals/:id           - Get Goal Details
 * - PUT    /goals/:id           - Update Goal
 * - DELETE /goals/:id           - Delete Goal
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { GoalApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalRoutes');
const responseBuilder = createResponseBuilder();

export function registerCrudRoutes(goalService: GoalApplicationService): Router {
  const router: Router = ExpressRouter();

  /**
   * @swagger
   * /api/goals:
   *   post:
   *     tags: [Goals]
   *     summary: Create a new goal
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
   *               - description
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               startDate:
   *                 type: string
   *                 format: date-time
   *               endDate:
   *                 type: string
   *                 format: date-time
   *               priority:
   *                 type: string
   *                 enum: [low, medium, high]
   *     responses:
   *       201:
   *         description: Goal created successfully
   */
  router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goal = await goalService.createGoal(req.user!.id, req.body);
      res.status(201).json(responseBuilder.success(goal, 'Goal created successfully'));
    } catch (error) {
      logger.error('Create goal failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals:
   *   get:
   *     tags: [Goals]
   *     summary: List user goals
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *       - in: query
   *         name: priority
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of goals
   */
  router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goals = await goalService.getUserGoals(req.user!.id);
      res.json(responseBuilder.success(goals));
    } catch (error) {
      logger.error('Get goals failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{id}:
   *   get:
   *     tags: [Goals]
   *     summary: Get goal details
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Goal details
   *       404:
   *         description: Goal not found
   */
  router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goal = await goalService.getGoal(req.params.id);
      if (!goal) {
        res.status(404).json(responseBuilder.error(404, 'Goal not found'));
        return;
      }
      res.json(responseBuilder.success(goal));
    } catch (error) {
      logger.error('Get goal failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{id}:
   *   put:
   *     tags: [Goals]
   *     summary: Update goal
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Goal updated
   */
  router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const goal = await goalService.updateGoal(req.params.id, req.body);
      res.json(responseBuilder.success(goal, 'Goal updated successfully'));
    } catch (error) {
      logger.error('Update goal failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/goals/{id}:
   *   delete:
   *     tags: [Goals]
   *     summary: Delete goal
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Goal deleted
   */
  router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      await goalService.deleteGoal(req.params.id);
      res.json(responseBuilder.success(null, 'Goal deleted successfully'));
    } catch (error) {
      logger.error('Delete goal failed:', error);
      throw error;
    }
  });

  return router;
}
