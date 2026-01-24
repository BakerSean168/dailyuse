/**
 * Dashboard Layout Routes
 * 处理仪表板布局和预设管理
 *
 * 端点:
 * - GET    /api/dashboard/layout        - 获取当前布局
 * - PUT    /api/dashboard/layout        - 更新布局
 * - POST   /api/dashboard/layout/presets - 保存布局预设
 * - GET    /api/dashboard/layout/presets - 获取布局预设列表
 * - DELETE /api/dashboard/layout/presets/:id - 删除布局预设
 * - POST   /api/dashboard/layout/apply-preset - 应用布局预设
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { DashboardApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('DashboardLayoutRoutes');
const responseBuilder = createResponseBuilder();

export function registerDashboardLayoutRoutes(dashboardService: DashboardApplicationService): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/dashboard/layout:
   *   get:
   *     tags: [Dashboard Layout]
   *     summary: 获取当前仪表板布局
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: dashboardId
   *         schema:
   *           type: string
   *         description: 获取特定仪表板的布局
   *     responses:
   *       200:
   *         description: 成功获取布局信息
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      const dashboardId = (req.query.dashboardId as string) || undefined;
      const layout = await service.getLayout(req.user.accountUuid, dashboardId);
      res.json(responseBuilder.success(layout, 'Layout retrieved'));
    } catch (error) {
      logger.error('Get layout failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/dashboard/layout:
   *   put:
   *     tags: [Dashboard Layout]
   *     summary: 更新仪表板布局
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - dashboardId
   *               - widgets
   *             properties:
   *               dashboardId:
   *                 type: string
   *               widgets:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     x:
   *                       type: integer
   *                     y:
   *                       type: integer
   *                     width:
   *                       type: integer
   *                     height:
   *                       type: integer
   *               gridSize:
   *                 type: integer
   *                 description: 栅格大小
   *               responsive:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: 布局已更新
   */
  router.put('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      const layout = await service.updateLayout(req.user.accountUuid, req.body);
      res.json(responseBuilder.success(layout, 'Layout updated'));
    } catch (error) {
      logger.error('Update layout failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/dashboard/layout/presets:
   *   get:
   *     tags: [Dashboard Layout]
   *     summary: 获取布局预设列表
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取预设列表
   */
  router.get('/presets', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      const presets = await service.getLayoutPresets(req.user.accountUuid);
      res.json(responseBuilder.success(presets, 'Layout presets retrieved'));
    } catch (error) {
      logger.error('Get presets failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/dashboard/layout/presets:
   *   post:
   *     tags: [Dashboard Layout]
   *     summary: 保存当前布局为预设
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
   *               - dashboardId
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               dashboardId:
   *                 type: string
   *               isDefault:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: 预设已保存
   */
  router.post('/presets', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      const preset = await service.saveLayoutPreset(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(preset, 'Layout preset saved'));
    } catch (error) {
      logger.error('Save preset failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/dashboard/layout/presets/{id}:
   *   delete:
   *     tags: [Dashboard Layout]
   *     summary: 删除布局预设
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
   *         description: 预设已删除
   */
  router.delete('/presets/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      await service.deleteLayoutPreset(req.user.accountUuid, req.params.id);
      res.json(responseBuilder.success({}, 'Layout preset deleted'));
    } catch (error) {
      logger.error('Delete preset failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/dashboard/layout/apply-preset:
   *   post:
   *     tags: [Dashboard Layout]
   *     summary: 应用布局预设
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - presetId
   *               - dashboardId
   *             properties:
   *               presetId:
   *                 type: string
   *               dashboardId:
   *                 type: string
   *     responses:
   *       200:
   *         description: 预设已应用
   */
  router.post('/apply-preset', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      const layout = await service.applyLayoutPreset(
        req.user.accountUuid,
        req.body.presetId,
        req.body.dashboardId,
      );
      res.json(responseBuilder.success(layout, 'Layout preset applied'));
    } catch (error) {
      logger.error('Apply preset failed:', error);
      throw error;
    }
  });

  return router;
}
