/**
 * Repository Permission Routes
 * 处理仓库的权限管理和共享控制
 *
 * 端点:
 * - POST   /api/repositories/:id/permissions           - 添加权限
 * - GET    /api/repositories/:id/permissions           - 获取权限列表
 * - PUT    /api/repositories/:id/permissions/:userId   - 更新权限
 * - DELETE /api/repositories/:id/permissions/:userId   - 删除权限
 * - POST   /api/repositories/:id/share                 - 分享仓库
 * - GET    /api/repositories/:id/share-links           - 获取分享链接
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { RepositoryPermissionApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('RepositoryPermissionRoutes');
const responseBuilder = createResponseBuilder();

export function registerRepositoryPermissionRoutes(): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/repositories/{id}/permissions:
   *   post:
   *     tags: [Repository Permissions]
   *     summary: 为用户/组添加权限
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
   *               - targetId
   *               - targetType
   *               - permission
   *             properties:
   *               targetId:
   *                 type: string
   *               targetType:
   *                 type: string
   *                 enum: [USER, GROUP, ROLE]
   *               permission:
   *                 type: string
   *                 enum: [VIEW, EDIT, ADMIN]
   *               expiresAt:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       201:
   *         description: 权限添加成功
   *       400:
   *         description: 请求参数错误
   */
  router.post('/:id/permissions', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryPermissionApplicationService.getInstance();
      const permission = await service.addPermission(req.params.id, req.body);
      res.status(201).json(responseBuilder.success(permission, 'Permission added'));
    } catch (error) {
      logger.error('Add permission failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/permissions:
   *   get:
   *     tags: [Repository Permissions]
   *     summary: 获取仓库权限列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: targetType
   *         schema:
   *           type: string
   *           enum: [USER, GROUP, ROLE]
   *     responses:
   *       200:
   *         description: 成功获取权限列表
   */
  router.get('/:id/permissions', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryPermissionApplicationService.getInstance();
      const permissions = await service.getPermissions(
        req.params.id,
        req.query.targetType as string,
      );
      res.json(responseBuilder.success(permissions, 'Permissions retrieved'));
    } catch (error) {
      logger.error('Get permissions failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/permissions/{userId}:
   *   put:
   *     tags: [Repository Permissions]
   *     summary: 更新用户权限
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: userId
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
   *               - permission
   *             properties:
   *               permission:
   *                 type: string
   *                 enum: [VIEW, EDIT, ADMIN]
   *               expiresAt:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: 权限已更新
   *       404:
   *         description: 权限记录不存在
   */
  router.put('/:id/permissions/:userId', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryPermissionApplicationService.getInstance();
      const updated = await service.updatePermission(req.params.id, req.params.userId, req.body);
      res.json(responseBuilder.success(updated, 'Permission updated'));
    } catch (error) {
      logger.error('Update permission failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/permissions/{userId}:
   *   delete:
   *     tags: [Repository Permissions]
   *     summary: 删除用户权限
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 权限已删除
   *       404:
   *         description: 权限记录不存在
   */
  router.delete('/:id/permissions/:userId', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryPermissionApplicationService.getInstance();
      await service.deletePermission(req.params.id, req.params.userId);
      res.json(responseBuilder.success(null, 'Permission deleted'));
    } catch (error) {
      logger.error('Delete permission failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/share:
   *   post:
   *     tags: [Repository Permissions]
   *     summary: 分享仓库
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
   *               - permission
   *             properties:
   *               permission:
   *                 type: string
   *                 enum: [VIEW, EDIT]
   *               expiresIn:
   *                 type: integer
   *                 description: 分享链接过期时间（天）
   *               password:
   *                 type: string
   *     responses:
   *       201:
   *         description: 分享链接已创建
   */
  router.post('/:id/share', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryPermissionApplicationService.getInstance();
      const shareLink = await service.createShareLink(req.params.id, req.body);
      res.status(201).json(responseBuilder.success(shareLink, 'Share link created'));
    } catch (error) {
      logger.error('Create share link failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/repositories/{id}/share-links:
   *   get:
   *     tags: [Repository Permissions]
   *     summary: 获取仓库的所有分享链接
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: includeExpired
   *         schema:
   *           type: boolean
   *           default: false
   *     responses:
   *       200:
   *         description: 成功获取分享链接列表
   */
  router.get('/:id/share-links', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await RepositoryPermissionApplicationService.getInstance();
      const shareLinks = await service.getShareLinks(
        req.params.id,
        req.query.includeExpired === 'true',
      );
      res.json(responseBuilder.success(shareLinks, 'Share links retrieved'));
    } catch (error) {
      logger.error('Get share links failed:', error);
      throw error;
    }
  });

  return router;
}
