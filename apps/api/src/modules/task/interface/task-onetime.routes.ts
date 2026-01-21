/**
 * One-Time Task Routes
 * 一次性任务的管理操作
 */

import { Router, type Router as ExpressRouter } from 'express';
import type { Request, Response } from 'express';
import { TaskTemplateApplicationService } from '@dailyuse/application-server/task';

export function registerTaskOnetimeRoutes(service?: TaskTemplateApplicationService): Router {
  const router: ExpressRouter = Router();

  const _stubController = (_req: Request, res: Response) => {
    res.status(501).json({ code: 5000, message: 'Not implemented' });
  };

/**
 * @swagger
 * /tasks/one-time:
 *   post:
 *     tags: [One-Time Tasks]
 *     summary: 创建一次性任务
 *     description: 创建一个新的一次性任务
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
 *               - startDate
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               importance:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *               urgency:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *               goalUuid:
 *                 type: string
 *               keyResultUuid:
 *                 type: string
 *               parentTaskUuid:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: 一次性任务创建成功
 *   get:
 *     tags: [One-Time Tasks]
 *     summary: 获取一次性任务列表
 *     description: 获取用户的所有一次性任务，支持多种过滤条件
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, BLOCKED, CANCELLED]
 *       - in: query
 *         name: goalUuid
 *         schema:
 *           type: string
 *       - in: query
 *         name: keyResultUuid
 *         schema:
 *           type: string
 *       - in: query
 *         name: parentTaskUuid
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: 标签列表（逗号分隔）
 *       - in: query
 *         name: startDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: startDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: minImportance
 *         schema:
 *           type: number
 *       - in: query
 *         name: minUrgency
 *         schema:
 *           type: number
 *       - in: query
 *         name: priorityLevels
 *         schema:
 *           type: string
 *         description: 优先级（逗号分隔，如 HIGH,MEDIUM）
 *     responses:
 *       200:
 *         description: 成功返回任务列表
 */
router.post('/one-time', service ? async (req: Request, res: Response) => {
    try {
      const accountUuid = (req as any).user?.accountUuid || req.body.accountUuid;
      if (!accountUuid) {
        res.status(401).json({ message: 'Unauthorized: missing account info' });
        return;
      }
      const result = await service.createOneTimeTask({ ...req.body, accountUuid });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  } : _stubController);
router.get('/one-time', service ? async (req: Request, res: Response) => {
    try {
      const accountUuid = (req as any).user?.accountUuid || req.query.accountUuid;
      if (!accountUuid) {
        res.status(401).json({ message: 'Unauthorized: missing account info' });
        return;
      }
      const filters: any = { ...req.query };
      const result = await service.findOneTimeTasks(accountUuid, filters);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  } : _stubController);

/**
 * @swagger
 * /tasks/{uuid}:
 *   patch:
 *     tags: [One-Time Tasks]
 *     summary: 更新一次性任务
 *     description: 更新任务的基本信息（标题、描述、日期、优先级等）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: number
 *               dueDate:
 *                 type: number
 *               importance:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *               urgency:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 4
 *               estimatedMinutes:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               color:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: 任务更新成功
 *       404:
 *         description: 任务不存在
 */
router.patch('/:uuid', service ? async (req: Request, res: Response) => {
    try {
      const result = await service.updateOneTimeTask(req.params.uuid, req.body);
      res.json(result);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  } : _stubController);

  return router;
}
