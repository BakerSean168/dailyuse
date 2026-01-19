/**
 * Schedule Conflict Detection Routes
 * 处理日程冲突检测和解决
 *
 * 端点:
 * - POST   /api/schedules/conflicts/detect     - 检测日程冲突
 * - GET    /api/schedules/conflicts            - 获取冲突列表
 * - POST   /api/schedules/conflicts/:id/resolve - 解决冲突
 * - POST   /api/schedules/conflicts/batch-resolve - 批量解决冲突
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ScheduleApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleConflictRoutes');
const responseBuilder = createResponseBuilder();

export function registerScheduleConflictRoutes(): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/schedules/conflicts/detect:
   *   post:
   *     tags: [Schedule Conflicts]
   *     summary: 检测日程冲突
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - scheduleIds
   *             properties:
   *               scheduleIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               dateRange:
   *                 type: object
   *                 properties:
   *                   startDate:
   *                     type: string
   *                     format: date-time
   *                   endDate:
   *                     type: string
   *                     format: date-time
   *     responses:
   *       200:
   *         description: 冲突检测完成，返回冲突列表
   *       400:
   *         description: 请求参数错误
   */
  router.post('/detect', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const conflicts = await service.detectConflicts(
        req.user.accountUuid,
        req.body.scheduleIds || [],
        req.body.dateRange,
      );
      res.json(responseBuilder.success(conflicts, 'Conflicts detected'));
    } catch (error) {
      logger.error('Detect conflicts failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/conflicts:
   *   get:
   *     tags: [Schedule Conflicts]
   *     summary: 获取冲突列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [unresolved, resolved, ignored]
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: 成功获取冲突列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const status = req.query.status as string;

      const conflicts = await service.getConflicts(req.user.accountUuid, status, page, limit);
      res.json(responseBuilder.success(conflicts, 'Conflicts retrieved'));
    } catch (error) {
      logger.error('Get conflicts failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/conflicts/{id}/resolve:
   *   post:
   *     tags: [Schedule Conflicts]
   *     summary: 解决冲突
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *               - resolution
   *             properties:
   *               resolution:
   *                 type: string
   *                 enum:
   *                   - RESCHEDULE_A
   *                   - RESCHEDULE_B
   *                   - MERGE
   *                   - DELETE_A
   *                   - DELETE_B
   *                   - KEEP_BOTH
   *               newStartTime:
   *                 type: string
   *                 format: date-time
   *                 description: 当选择 RESCHEDULE_A 或 RESCHEDULE_B 时需要
   *               newEndTime:
   *                 type: string
   *                 format: date-time
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: 冲突已解决
   *       400:
   *         description: 解决方案参数不完整
   */
  router.post('/:id/resolve', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const result = await service.resolveConflict(req.params.id, req.body.resolution, {
        newStartTime: req.body.newStartTime,
        newEndTime: req.body.newEndTime,
        notes: req.body.notes,
      });
      res.json(responseBuilder.success(result, 'Conflict resolved'));
    } catch (error) {
      logger.error('Resolve conflict failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/schedules/conflicts/batch-resolve:
   *   post:
   *     tags: [Schedule Conflicts]
   *     summary: 批量解决冲突
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - conflicts
   *             properties:
   *               conflicts:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - id
   *                     - resolution
   *                   properties:
   *                     id:
   *                       type: string
   *                     resolution:
   *                       type: string
   *                     newStartTime:
   *                       type: string
   *                       format: date-time
   *                     newEndTime:
   *                       type: string
   *                       format: date-time
   *     responses:
   *       200:
   *         description: 冲突已批量解决
   *       400:
   *         description: 请求参数错误
   */
  router.post('/batch-resolve', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await ScheduleApplicationService.getInstance();
      const results = await service.batchResolveConflicts(req.user.accountUuid, req.body.conflicts);
      res.json(responseBuilder.success(results, 'Conflicts batch resolved'));
    } catch (error) {
      logger.error('Batch resolve conflicts failed:', error);
      throw error;
    }
  });

  return router;
}
