/**
 * Setting User Routes
 * 处理用户个人设置和偏好
 *
 * 端点:
 * - POST   /api/settings/user           - 创建或更新用户设置
 * - GET    /api/settings/user           - 获取用户设置
 * - PATCH  /api/settings/user/preferences - 更新偏好设置
 * - DELETE /api/settings/user/reset     - 重置为默认值
 * - PATCH  /api/settings/user/language  - 更改语言
 * - PATCH  /api/settings/user/timezone  - 更改时区
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import type { AuthenticatedRequest } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import { authMiddleware } from '../../../shared/infrastructure/http/middlewares/authMiddleware';
import type { SettingApplicationService } from '@dailyuse/application-server/setting';
// import { SettingApplicationService } from '@dailyuse/application-server'; // Removed implementation import
import { createResponseBuilder } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('SettingUserRoutes');
const responseBuilder = createResponseBuilder();

export function registerSettingUserRoutes(settingService: SettingApplicationService): Router {
  const router: Router = ExpressRouter();

  router.use(authMiddleware);

  /**
   * @swagger
   * /api/settings/user:
   *   post:
   *     tags: [Settings - User]
   *     summary: 创建或更新用户设置
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               language:
   *                 type: string
   *                 enum: [en, zh, es, fr, de]
   *               timezone:
   *                 type: string
   *               theme:
   *                 type: string
   *                 enum: [light, dark, auto]
   *               notifications:
   *                 type: object
   *               privacy:
   *                 type: object
   *     responses:
   *       201:
   *         description: 设置创建或更新成功
   */
  router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
      // const service = await SettingApplicationService.getInstance();
      const setting = await settingService.updateUserSetting(req.user.accountUuid, req.body);
      res.status(201).json(responseBuilder.success(setting, 'User setting updated'));
    } catch (error) {
      logger.error('Update user setting failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/settings/user:
   *   get:
   *     tags: [Settings - User]
   *     summary: 获取用户设置
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 成功获取用户设置
   */
  router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
      // const service = await SettingApplicationService.getInstance();
      const setting = await settingService.getUserSetting(req.user.accountUuid);
      res.json(responseBuilder.success(setting, 'User setting retrieved'));
    } catch (error) {
      logger.error('Get user setting failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/settings/user/preferences:
   *   patch:
   *     tags: [Settings - User]
   *     summary: 更新偏好设置
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               defaultView:
   *                 type: string
   *               sortBy:
   *                 type: string
   *               itemsPerPage:
   *                 type: integer
   *               autoSave:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: 偏好设置已更新
   */
  router.patch('/preferences', async (req: AuthenticatedRequest, res) => {
    try {
      // const service = await SettingApplicationService.getInstance();
      const setting = await settingService.updatePreferences(req.user.accountUuid, req.body);
      res.json(responseBuilder.success(setting, 'Preferences updated'));
    } catch (error) {
      logger.error('Update preferences failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/settings/user/reset:
   *   delete:
   *     tags: [Settings - User]
   *     summary: 重置为默认值
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 已重置为默认设置
   */
  router.delete('/reset', async (req: AuthenticatedRequest, res) => {
    try {
      // const service = await SettingApplicationService.getInstance();
      const setting = await settingService.resetToDefaults(req.user.accountUuid);
      res.json(responseBuilder.success(setting, 'Settings reset to defaults'));
    } catch (error) {
      logger.error('Reset settings failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/settings/user/language:
   *   patch:
   *     tags: [Settings - User]
   *     summary: 更改语言
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - language
   *             properties:
   *               language:
   *                 type: string
   *                 enum: [en, zh, es, fr, de]
   *     responses:
   *       200:
   *         description: 语言已更改
   */
  router.patch('/language', async (req: AuthenticatedRequest, res) => {
    try {
      // const service = await SettingApplicationService.getInstance();
      const setting = await settingService.updateLanguage(req.user.accountUuid, req.body.language);
      res.json(responseBuilder.success(setting, 'Language updated'));
    } catch (error) {
      logger.error('Update language failed:', error);
      throw error;
    }
  });

  /**
   * @swagger
   * /api/settings/user/timezone:
   *   patch:
   *     tags: [Settings - User]
   *     summary: 更改时区
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - timezone
   *             properties:
   *               timezone:
   *                 type: string
   *     responses:
   *       200:
   *         description: 时区已更改
   */
  router.patch('/timezone', async (req: AuthenticatedRequest, res) => {
    try {
      // const service = await SettingApplicationService.getInstance();
      const setting = await settingService.updateTimezone(req.user.accountUuid, req.body.timezone);
      res.json(responseBuilder.success(setting, 'Timezone updated'));
    } catch (error) {
      logger.error('Update timezone failed:', error);
      throw error;
    }
  });

  return router;
}
