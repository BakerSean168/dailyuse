/**
 * Setting System Routes
 * 处理系统级设置（管理员权限）
 *
 * 端点:
 * - GET    /api/settings/system         - 获取系统设置
 * - PUT    /api/settings/system         - 更新系统设置 (Admin only)
 * - GET    /api/settings/system/defaults - 获取默认值
 * - GET    /api/settings/system/features - 获取功能开关
 * - PATCH  /api/settings/system/features - 更新功能开关 (Admin only)
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import type { SettingApplicationService } from '@dailyuse/application-server/setting';
// import { SettingApplicationService } from '@dailyuse/application-server';
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('SettingSystemRoutes');
const responseBuilder = createResponseBuilder();

export function registerSettingSystemRoutes(settingService: SettingApplicationService): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/settings/system:
   *   get:
   *     tags: [Settings - System]
   *     summary: 获取系统设置
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取系统设置
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      // const service = await SettingApplicationService.getInstance();
      const systemSettings = await settingService.getSystemSettings();
      res.json(responseBuilder.success(systemSettings, 'System settings retrieved'));
    } catch (error) {
      logger.error('Get system settings failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/settings/system:
   *   put:
   *     tags: [Settings - System]
   *     summary: 更新系统设置 (Admin only)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               maintenanceMode:
   *                 type: boolean
   *               sessionTimeout:
   *                 type: integer
   *               maxUploadSize:
   *                 type: integer
   *               enableRegistration:
   *                 type: boolean
   *               emailVerificationRequired:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: 系统设置已更新
   *       403:
   *         description: 无权限修改系统设置
   */
  router.put('/', async (req: AuthenticatedRequest, res) => {
    try {
      // 在实际实现中应该检查是否是管理员
      // const service = await SettingApplicationService.getInstance();
      const systemSettings = await settingService.updateSystemSettings(req.body);
      res.json(responseBuilder.success(systemSettings, 'System settings updated'));
    } catch (error) {
      logger.error('Update system settings failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/settings/system/defaults:
   *   get:
   *     tags: [Settings - System]
   *     summary: 获取默认值
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取默认设置值
   */
  router.get('/defaults', async (req: AuthenticatedRequest, res) => {
    try {
      // const service = await SettingApplicationService.getInstance();
      const defaults = await settingService.getDefaultSettings();
      res.json(responseBuilder.success(defaults, 'Default settings retrieved'));
    } catch (error) {
      logger.error('Get default settings failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/settings/system/features:
   *   get:
   *     tags: [Settings - System]
   *     summary: 获取功能开关
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取功能开关状态
   */
  router.get('/features', async (req: AuthenticatedRequest, res) => {
    try {
      // const service = await SettingApplicationService.getInstance();
      const features = await settingService.getFeatureFlags();
      res.json(responseBuilder.success(features, 'Feature flags retrieved'));
    } catch (error) {
      logger.error('Get feature flags failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/settings/system/features:
   *   patch:
   *     tags: [Settings - System]
   *     summary: 更新功能开关 (Admin only)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               featureName:
   *                 type: string
   *               enabled:
   *                 type: boolean
   *               beta:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: 功能开关已更新
   *       403:
   *         description: 无权限修改功能开关
   */
  router.patch('/features', async (req: AuthenticatedRequest, res) => {
    try {
      // const service = await SettingApplicationService.getInstance();
      const updated = await settingService.updateFeatureFlags(req.body);
      res.json(responseBuilder.success(updated, 'Feature flags updated'));
    } catch (error) {
      logger.error('Update feature flags failed:', error);
      throw error;
    }
  });

  return router;
}
