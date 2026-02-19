/**
 * Setting API Routes
 *
 * 路由定义与请求处理。
 * 中间件通过参数注入（来自 ApiBootstrapper 上下文），
 * 不直接依赖 apps/api 内部实现。
 *
 * Routes:
 *   GET    /              — 获取用户设置 (GetUserSettingSchema)
 *   PUT    /              — 更新用户设置 (UpdateUserSettingSchema)
 *   POST   /reset         — 重置用户设置 (ResetUserSettingSchema)
 *   POST   /export        — 导出设置 (ExportSettingsSchema)
 *   POST   /import        — 导入设置 (ImportSettingsSchema)
 *   GET    /defaults       — 获取默认设置
 */

import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import {
  UpdateUserSettingSchema,
  ResetUserSettingSchema,
} from '@dailyuse/contracts/setting';
import {
  ExportSettingsSchema,
  ImportSettingsSchema,
} from '@dailyuse/contracts/setting';
import { createExpressHelper } from '@dailyuse/utils/result';

// ============ Types ============

interface AuthenticatedRequest extends Request {
  id?: string;
  traceId?: string;
  startTime?: number;
  user?: {
    identityId: string;
    sessionId?: string;
    tokenType?: string;
    exp?: number;
  };
}

export interface SettingRouteHandlers {
  getUserSetting(identityId: string): Promise<any>;
  updateUserSetting(identityId: string, data: any): Promise<any>;
  resetUserSetting(identityId: string): Promise<any>;
  exportSettings(identityId: string): Promise<any>;
  importSettings(identityId: string, data: Record<string, any>, options?: { merge?: boolean; validate?: boolean }): Promise<any>;
  getDefaultSettings(): any;
}

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerSettingRoutes(
  handlers: SettingRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // GET / — 获取用户设置
  router.get('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }

      const result = await handlers.getUserSetting(req.user.identityId);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return helper.internalError(message);
    }
  });

  // PUT / — 更新用户设置 (UpdateUserSettingSchema)
  router.put('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }

      const parsed = UpdateUserSettingSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.updateUserSetting(req.user.identityId, parsed.data);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      return helper.badRequest(message);
    }
  });

  // POST /reset — 重置用户设置 (ResetUserSettingSchema)
  router.post('/reset', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }

      const parsed = ResetUserSettingSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.resetUserSetting(req.user.identityId);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reset failed';
      return helper.badRequest(message);
    }
  });

  // POST /export — 导出设置 (ExportSettingsSchema)
  router.post('/export', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }

      const parsed = ExportSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.exportSettings(req.user.identityId);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      return helper.internalError(message);
    }
  });

  // POST /import — 导入设置 (ImportSettingsSchema)
  router.post('/import', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }

      const parsed = ImportSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`参数验证失败: ${details.map(d => d.message).join(', ')}`);
      }

      const importData = JSON.parse(parsed.data.data) as Record<string, any>;
      const result = await handlers.importSettings(
        req.user.identityId,
        importData,
        { merge: !parsed.data.overwrite },
      );
      return helper.created(result, '设置导入成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      return helper.badRequest(message);
    }
  });

  // GET /defaults — 获取默认设置
  router.get('/defaults', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const result = handlers.getDefaultSettings();
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal Server Error';
      return helper.internalError(message);
    }
  });

  return router;
}
