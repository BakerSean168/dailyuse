/**
 * Dashboard Widget Routes
 * 处理仪表板小部件的管理和配置
 *
 * 端点:
 * - GET    /api/dashboard/widgets       - 获取小部件列表
 * - GET    /api/dashboard/widgets/:id   - 获取小部件详情
 * - POST   /api/dashboard/instances     - 创建小部件实例
 * - PATCH  /api/dashboard/instances/:id - 更新小部件实例配置
 * - DELETE /api/dashboard/instances/:id - 删除小部件实例
 * - GET    /api/dashboard/instances     - 获取用户的小部件实例
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { DashboardApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('DashboardWidgetRoutes');
const responseBuilder = createResponseBuilder();

export function registerDashboardWidgetRoutes(): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/dashboard/widgets:
   *   get:
   *     tags: [Dashboard Widget]
   *     summary: 获取可用的小部件列表
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: 按类别过滤小部件
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: 搜索小部件名称
   *     responses:
   *       200:
   *         description: 成功获取小部件列表
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      const category = (req.query.category as string) || undefined;
      const search = (req.query.search as string) || undefined;
      const widgets = await service.getAvailableWidgets(category, search);
      res.json(responseBuilder.success(widgets, 'Available widgets retrieved'));
    } catch (error) {
      logger.error('Get widgets failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/dashboard/widgets/{id}:
   *   get:
   *     tags: [Dashboard Widget]
   *     summary: 获取小部件详情
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
   *         description: 成功获取小部件详情
   *       404:
   *         description: 小部件不存在
   */
  router.get('/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      const widget = await service.getWidgetDetails(req.params.id);
      res.json(responseBuilder.success(widget, 'Widget details retrieved'));
    } catch (error) {
      logger.error('Get widget details failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/dashboard/instances:
   *   get:
   *     tags: [Dashboard Widget]
   *     summary: 获取用户的小部件实例
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: dashboardId
   *         schema:
   *           type: string
   *         description: 获取特定仪表板的小部件实例
   *     responses:
   *       200:
   *         description: 成功获取小部件实例列表
   */
  router.get('/instances', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      const dashboardId = (req.query.dashboardId as string) || undefined;
      const instances = await service.getUserWidgetInstances(req.user.accountUuid, dashboardId);
      res.json(responseBuilder.success(instances, 'Widget instances retrieved'));
    } catch (error) {
      logger.error('Get widget instances failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/dashboard/instances:
   *   post:
   *     tags: [Dashboard Widget]
   *     summary: 创建小部件实例
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - widgetId
   *               - dashboardId
   *             properties:
   *               widgetId:
   *                 type: string
   *                 description: 小部件类型 ID
   *               dashboardId:
   *                 type: string
   *                 description: 目标仪表板 ID
   *               config:
   *                 type: object
   *                 description: 小部件配置选项
   *               position:
   *                 type: object
   *                 properties:
   *                   x:
   *                     type: integer
   *                   y:
   *                     type: integer
   *                   width:
   *                     type: integer
   *                   height:
   *                     type: integer
   *     responses:
   *       201:
   *         description: 小部件实例已创建
   */
  router.post('/instances', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      const instance = await service.createWidgetInstance(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(instance, 'Widget instance created'));
    } catch (error) {
      logger.error('Create widget instance failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/dashboard/instances/{id}:
   *   patch:
   *     tags: [Dashboard Widget]
   *     summary: 更新小部件实例配置
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
   *               config:
   *                 type: object
   *               position:
   *                 type: object
   *               enabled:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: 小部件实例已更新
   */
  router.patch('/instances/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      const instance = await service.updateWidgetInstance(
        req.user.accountUuid,
        req.params.id,
        req.body,
      );
      res.json(responseBuilder.success(instance, 'Widget instance updated'));
    } catch (error) {
      logger.error('Update widget instance failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/dashboard/instances/{id}:
   *   delete:
   *     tags: [Dashboard Widget]
   *     summary: 删除小部件实例
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
   *         description: 小部件实例已删除
   */
  router.delete('/instances/:id', async (req: AuthenticatedRequest, res) => {
    try {
      const service = await DashboardApplicationService.getInstance();
      await service.deleteWidgetInstance(req.user.accountUuid, req.params.id);
      res.json(responseBuilder.success({}, 'Widget instance deleted'));
    } catch (error) {
      logger.error('Delete widget instance failed:', error);
      throw error;
    }
  });

  return router;
}
