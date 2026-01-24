/**
 * Repository Sync Routes
 * 处理仓库的同步操作和版本控制
 *
 * 端点:
 * - POST   /api/repositories/:id/sync            - 同步仓库
 * - GET    /api/repositories/:id/sync-status     - 获取同步状态
 * - POST   /api/repositories/:id/pull            - 拉取更新
 * - POST   /api/repositories/:id/push            - 推送更新
 * - GET    /api/repositories/:id/changes         - 获取变更记录
 * - POST   /api/repositories/:id/revert          - 恢复到特定版本
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { RepositorySyncApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RepositorySyncRoutes');
const responseBuilder = createResponseBuilder();

export function registerRepositorySyncRoutes(syncService: RepositorySyncApplicationService): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/repositories/{id}/sync:
   *   post:
   *     tags: [Repository Sync]
   *     summary: 同步仓库
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
   *             properties:
   *               full:
   *                 type: boolean
   *                 description: 是否执行完整同步
   *               timeout:
   *                 type: integer
   *                 description: 同步超时时间（秒）
   *     responses:
   *       202:
   *         description: 同步任务已启动
   *       404:
   *         description: 仓库不存在
   */
  router.post('/:id/sync', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositorySyncApplicationService.getInstance();
      const task = await service.syncRepository(req.params.id, req.body.full, req.body.timeout);
      res.status(202).json(responseBuilder.success(task, 'Sync task started'));
    } catch (error) {
      logger.error('Sync repository failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/sync-status:
   *   get:
   *     tags: [Repository Sync]
   *     summary: 获取同步状态
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
   *         description: 成功获取同步状态
   */
  router.get('/:id/sync-status', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositorySyncApplicationService.getInstance();
      const status = await service.getSyncStatus(req.params.id);
      res.json(responseBuilder.success(status, 'Sync status retrieved'));
    } catch (error) {
      logger.error('Get sync status failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/pull:
   *   post:
   *     tags: [Repository Sync]
   *     summary: 拉取远程仓库更新
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
   *             properties:
   *               branch:
   *                 type: string
   *               strategy:
   *                 type: string
   *                 enum: [merge, rebase, overwrite]
   *     responses:
   *       202:
   *         description: 拉取任务已启动
   */
  router.post('/:id/pull', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositorySyncApplicationService.getInstance();
      const task = await service.pullRepository(req.params.id, req.body.branch, req.body.strategy);
      res.status(202).json(responseBuilder.success(task, 'Pull task started'));
    } catch (error) {
      logger.error('Pull repository failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/push:
   *   post:
   *     tags: [Repository Sync]
   *     summary: 推送到远程仓库
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
   *             properties:
   *               branch:
   *                 type: string
   *               message:
   *                 type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       202:
   *         description: 推送任务已启动
   */
  router.post('/:id/push', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositorySyncApplicationService.getInstance();
      const task = await service.pushRepository(
        req.params.id,
        req.body.branch,
        req.body.message,
        req.body.tags,
      );
      res.status(202).json(responseBuilder.success(task, 'Push task started'));
    } catch (error) {
      logger.error('Push repository failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/changes:
   *   get:
   *     tags: [Repository Sync]
   *     summary: 获取仓库变更记录
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *     responses:
   *       200:
   *         description: 成功获取变更记录
   */
  router.get('/:id/changes', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositorySyncApplicationService.getInstance();
      const limit = Number(req.query.limit) || 50;
      const changes = await service.getChangeHistory(req.params.id, {
        limit,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });
      res.json(responseBuilder.success(changes, 'Changes retrieved'));
    } catch (error) {
      logger.error('Get changes failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/revert:
   *   post:
   *     tags: [Repository Sync]
   *     summary: 恢复到特定版本
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
   *               - version
   *             properties:
   *               version:
   *                 type: string
   *               reason:
   *                 type: string
   *     responses:
   *       202:
   *         description: 恢复任务已启动
   */
  router.post('/:id/revert', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositorySyncApplicationService.getInstance();
      const task = await service.revertToVersion(req.params.id, req.body.version, req.body.reason);
      res.status(202).json(responseBuilder.success(task, 'Revert task started'));
    } catch (error) {
      logger.error('Revert repository failed:', error);
      throw error;
    }
  });

  return router;
}
