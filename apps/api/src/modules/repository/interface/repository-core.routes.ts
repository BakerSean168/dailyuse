/**
 * Repository Core Routes
 * 处理仓库的基础 CRUD 操作和管理
 *
 * 端点:
 * - POST   /api/repositories           - 创建仓库
 * - GET    /api/repositories           - 获取仓库列表
 * - GET    /api/repositories/:id       - 获取仓库详情
 * - PUT    /api/repositories/:id       - 更新仓库
 * - DELETE /api/repositories/:id       - 删除仓库
 * - PATCH  /api/repositories/:id/settings - 更新仓库设置
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { RepositoryApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RepositoryCoreRoutes');
const responseBuilder = createResponseBuilder();

export function registerRepositoryCoreRoutes(repositoryService: RepositoryApplicationService): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/repositories:
   *   post:
   *     tags: [Repositories]
   *     summary: 创建仓库
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - type
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [LOCAL, CLOUD, GIT, EXTERNAL]
   *               location:
   *                 type: string
   *               accessLevel:
   *                 type: string
   *                 enum: [PRIVATE, SHARED, PUBLIC]
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *               settings:
   *                 type: object
   *     responses:
   *       201:
   *         description: 仓库创建成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryApplicationService.getInstance();
      const repository = await service.createRepository(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(repository, 'Repository created'));
    } catch (error) {
      logger.error('Create repository failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories:
   *   get:
   *     tags: [Repositories]
   *     summary: 获取仓库列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *       - in: query
   *         name: accessLevel
   *         schema:
   *           type: string
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
   *         description: 成功获取仓库列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryApplicationService.getInstance();
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const filters = {
        type: req.query.type as string,
        accessLevel: req.query.accessLevel as string,
      };
      const repositories = await service.getUserRepositories(
        req.user.accountUuid,
        filters,
        page,
        limit,
      );
      res.json(responseBuilder.success(repositories, 'Repositories retrieved'));
    } catch (error) {
      logger.error('Get repositories failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}:
   *   get:
   *     tags: [Repositories]
   *     summary: 获取仓库详情
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
   *         description: 成功获取仓库
   *       404:
   *         description: 仓库不存在
   */
  router.get('/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryApplicationService.getInstance();
      const repository = await service.getRepository(req.params.id);
      res.json(responseBuilder.success(repository, 'Repository retrieved'));
    } catch (error) {
      logger.error('Get repository failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}:
   *   put:
   *     tags: [Repositories]
   *     summary: 更新仓库
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
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               accessLevel:
   *                 type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: 仓库更新成功
   *       404:
   *         description: 仓库不存在
   */
  router.put('/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryApplicationService.getInstance();
      const updated = await service.updateRepository(req.params.id, req.body);
      res.json(responseBuilder.success(updated, 'Repository updated'));
    } catch (error) {
      logger.error('Update repository failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}:
   *   delete:
   *     tags: [Repositories]
   *     summary: 删除仓库
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
   *               force:
   *                 type: boolean
   *                 description: 强制删除包括所有资源
   *     responses:
   *       200:
   *         description: 仓库删除成功
   *       404:
   *         description: 仓库不存在
   */
  router.delete('/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryApplicationService.getInstance();
      await service.deleteRepository(req.params.id, req.body.force);
      res.json(responseBuilder.success(null, 'Repository deleted'));
    } catch (error) {
      logger.error('Delete repository failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/settings:
   *   patch:
   *     tags: [Repositories]
   *     summary: 更新仓库设置
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
   *             properties:
   *               autoSync:
   *                 type: boolean
   *               retention:
   *                 type: integer
   *                 description: 保留时间（天）
   *               compression:
   *                 type: boolean
   *               encryption:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: 设置已更新
   */
  router.patch('/:id/settings', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryApplicationService.getInstance();
      const updated = await service.updateSettings(req.params.id, req.body);
      res.json(responseBuilder.success(updated, 'Settings updated'));
    } catch (error) {
      logger.error('Update settings failed:', error);
      throw error;
    }
  });

  return router;
}
