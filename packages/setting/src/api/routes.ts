/**
 * Setting API Routes
 *
 * Uses expressAdapter to eliminate boilerplate code.
 *
 * Routes:
 *   GET    /              — 获取用户设置
 *   PUT    /              — 更新用户设置 (UpdateUserSettingSchema)
 *   POST   /reset         — 重置用户设置 (ResetUserSettingSchema)
 *   POST   /export        — 导出设置 (ExportSettingsSchema)
 *   POST   /import        — 导入设置 (ImportSettingsSchema)
 *   GET    /defaults      — 获取默认设置
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import { SettingController } from '../controllers/setting.controller';
import type { SettingUseCases } from '../controllers/setting.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerSettingRoutes(
  handlers: SettingUseCases,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new SettingController(handlers);

  // GET / — 获取用户设置
  router.get('/', auth, expressAdapter(
    (_req, ctx) => controller.getUserSetting(ctx),
  ));

  // PUT / — 更新用户设置 (UpdateUserSettingSchema)
  router.put('/', auth, expressAdapter(
    (req, ctx) => controller.updateUserSetting(req.body, ctx),
  ));

  // POST /reset — 重置用户设置 (ResetUserSettingSchema)
  router.post('/reset', auth, expressAdapter(
    (req, ctx) => controller.resetUserSetting(req.body, ctx),
  ));

  // POST /export — 导出设置 (ExportSettingsSchema)
  router.post('/export', auth, expressAdapter(
    (req, ctx) => controller.exportSettings(req.body, ctx),
  ));

  // POST /import — 导入设置 (ImportSettingsSchema)
  router.post('/import', auth, expressAdapter(
    (req, ctx) => controller.importSettings(req.body, ctx),
    { successStatus: 201 },
  ));

  // GET /defaults — 获取默认设置
  router.get('/defaults', auth, expressAdapter(
    () => controller.getDefaultSettings(),
    { requireAuth: false },
  ));

  return router;
}
