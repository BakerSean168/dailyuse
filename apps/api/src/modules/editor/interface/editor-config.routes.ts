/**
 * Editor Config Routes
 * 处理编辑器配置和快捷键设置
 *
 * 端点:
 * - GET    /api/editor/config           - 获取编辑器配置
 * - PUT    /api/editor/config           - 更新编辑器配置
 * - PATCH  /api/editor/config/shortcuts - 更新快捷键
 * - GET    /api/editor/config/presets   - 获取配置预设
 * - POST   /api/editor/config/presets   - 创建配置预设
 * - DELETE /api/editor/config/reset     - 重置为默认配置
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { EditorApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('EditorConfigRoutes');
const responseBuilder = createResponseBuilder();

export function registerEditorConfigRoutes(): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/editor/config:
   *   get:
   *     tags: [Editor Config]
   *     summary: 获取编辑器配置
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取编辑器配置
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const config = await service.getUserEditorConfig(req.user.accountUuid);
      res.json(responseBuilder.success(config, 'Editor config retrieved'));
    } catch (error) {
      logger.error('Get editor config failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/config:
   *   put:
   *     tags: [Editor Config]
   *     summary: 更新编辑器配置
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fontSize:
   *                 type: integer
   *               lineHeight:
   *                 type: number
   *               tabSize:
   *                 type: integer
   *               indentType:
   *                 type: string
   *                 enum: [space, tab]
   *               wordWrap:
   *                 type: boolean
   *               miniMap:
   *                 type: boolean
   *               autoSave:
   *                 type: boolean
   *               formatOnSave:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: 编辑器配置已更新
   */
  router.put('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const config = await service.updateEditorConfig(req.user.accountUuid, req.body);
      res.json(responseBuilder.success(config, 'Editor config updated'));
    } catch (error) {
      logger.error('Update editor config failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/config/shortcuts:
   *   patch:
   *     tags: [Editor Config]
   *     summary: 更新快捷键绑定
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               shortcuts:
   *                 type: object
   *     responses:
   *       200:
   *         description: 快捷键已更新
   */
  router.patch('/shortcuts', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const config = await service.updateShortcuts(req.user.accountUuid, req.body.shortcuts);
      res.json(responseBuilder.success(config, 'Shortcuts updated'));
    } catch (error) {
      logger.error('Update shortcuts failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/config/presets:
   *   get:
   *     tags: [Editor Config]
   *     summary: 获取配置预设列表
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取预设列表
   */
  router.get('/presets', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const presets = await service.getConfigPresets(req.user.accountUuid);
      res.json(responseBuilder.success(presets, 'Config presets retrieved'));
    } catch (error) {
      logger.error('Get presets failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/config/presets:
   *   post:
   *     tags: [Editor Config]
   *     summary: 创建配置预设
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
   *               - config
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               config:
   *                 type: object
   *     responses:
   *       201:
   *         description: 预设已创建
   */
  router.post('/presets', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const preset = await service.createConfigPreset(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(preset, 'Config preset created'));
    } catch (error) {
      logger.error('Create preset failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/editor/config/reset:
   *   delete:
   *     tags: [Editor Config]
   *     summary: 重置为默认配置
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 配置已重置
   */
  router.delete('/reset', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await EditorApplicationService.getInstance();
      const config = await service.resetToDefaults(req.user.accountUuid);
      res.json(responseBuilder.success(config, 'Config reset to defaults'));
    } catch (error) {
      logger.error('Reset config failed:', error);
      throw error;
    }
  });

  return router;
}
