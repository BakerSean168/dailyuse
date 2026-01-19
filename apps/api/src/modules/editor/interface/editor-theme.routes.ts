/**
 * Editor Theme Routes
 * 处理编辑器主题和外观设置
 *
 * 端点:
 * - GET    /api/editor/themes         - 获取主题列表
 * - GET    /api/editor/themes/:id     - 获取主题详情
 * - POST   /api/editor/themes         - 创建自定义主题
 * - PUT    /api/editor/themes/:id     - 更新自定义主题
 * - DELETE /api/editor/themes/:id     - 删除自定义主题
 * - PATCH  /api/editor/active-theme   - 设置当前主题
 * - GET    /api/editor/active-theme   - 获取当前激活的主题
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { EditorApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('EditorThemeRoutes');
const responseBuilder = createResponseBuilder();

export function registerEditorThemeRoutes(): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/editor/themes:
   *   get:
   *     tags: [Editor Theme]
   *     summary: 获取主题列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [built-in, custom, all]
   *         description: 过滤主题类型
   *     responses:
   *       200:
   *         description: 成功获取主题列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const type = (req.query.type as string) || 'all';
      const themes = await service.getThemes(req.user.accountUuid, type);
      res.json(responseBuilder.success(themes, 'Themes retrieved'));
    } catch (error) {
      logger.error('Get themes failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/themes/{id}:
   *   get:
   *     tags: [Editor Theme]
   *     summary: 获取主题详情
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
   *         description: 成功获取主题详情
   *       404:
   *         description: 主题不存在
   */
  router.get('/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const theme = await service.getThemeById(req.user.accountUuid, req.params.id);
      res.json(responseBuilder.success(theme, 'Theme retrieved'));
    } catch (error) {
      logger.error('Get theme failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/themes:
   *   post:
   *     tags: [Editor Theme]
   *     summary: 创建自定义主题
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
   *               - colors
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               colors:
   *                 type: object
   *                 properties:
   *                   background:
   *                     type: string
   *                   foreground:
   *                     type: string
   *                   accent:
   *                     type: string
   *               baseTheme:
   *                 type: string
   *                 enum: [light, dark]
   *     responses:
   *       201:
   *         description: 自定义主题已创建
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const theme = await service.createTheme(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(theme, 'Theme created'));
    } catch (error) {
      logger.error('Create theme failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/themes/{id}:
   *   put:
   *     tags: [Editor Theme]
   *     summary: 更新自定义主题
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
   *               colors:
   *                 type: object
   *     responses:
   *       200:
   *         description: 主题已更新
   *       404:
   *         description: 主题不存在
   */
  router.put('/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const theme = await service.updateTheme(req.user.accountUuid, req.params.id, req.body);
      res.json(responseBuilder.success(theme, 'Theme updated'));
    } catch (error) {
      logger.error('Update theme failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/themes/{id}:
   *   delete:
   *     tags: [Editor Theme]
   *     summary: 删除自定义主题
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
   *         description: 主题已删除
   *       404:
   *         description: 主题不存在
   *       400:
   *         description: 不能删除内置主题
   */
  router.delete('/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      await service.deleteTheme(req.user.accountUuid, req.params.id);
      res.json(responseBuilder.success({}, 'Theme deleted'));
    } catch (error) {
      logger.error('Delete theme failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/active-theme:
   *   get:
   *     tags: [Editor Theme]
   *     summary: 获取当前激活的主题
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取激活的主题
   */
  router.get('/active', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const theme = await service.getActiveTheme(req.user.accountUuid);
      res.json(responseBuilder.success(theme, 'Active theme retrieved'));
    } catch (error) {
      logger.error('Get active theme failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/active-theme:
   *   patch:
   *     tags: [Editor Theme]
   *     summary: 设置当前主题
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - themeId
   *             properties:
   *               themeId:
   *                 type: string
   *     responses:
   *       200:
   *         description: 主题已设置为当前活跃主题
   */
  router.patch('/active', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const theme = await service.setActiveTheme(req.user.accountUuid, req.body.themeId);
      res.json(responseBuilder.success(theme, 'Active theme updated'));
    } catch (error) {
      logger.error('Set active theme failed:', error);
      throw error;
    }
  });

  return router;
}
