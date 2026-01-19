/**
 * Setting Routes Aggregator
 * 聚合所有设置相关的 HTTP 路由
 *
 * 模块化设计 - 按用例拆分:
 * - User: 用户个人设置
 * - System: 系统级设置（管理员）
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerSettingUserRoutes } from './setting-user.routes';
import { registerSettingSystemRoutes } from './setting-system.routes';

export function registerSettingRoutes(): Router {
  const router: Router = ExpressRouter();

  // ============ 用户设置路由 ============
  // POST   /api/settings/user              - 创建或更新设置
  // GET    /api/settings/user              - 获取设置
  // PATCH  /api/settings/user/preferences  - 更新偏好
  // DELETE /api/settings/user/reset        - 重置为默认
  // PATCH  /api/settings/user/language     - 更改语言
  // PATCH  /api/settings/user/timezone     - 更改时区
  router.use('/', registerSettingUserRoutes());

  // ============ 系统设置路由 ============
  // GET    /api/settings/system            - 获取系统设置
  // PUT    /api/settings/system            - 更新系统设置 (Admin)
  // GET    /api/settings/system/defaults   - 获取默认值
  // GET    /api/settings/system/features   - 获取功能开关
  // PATCH  /api/settings/system/features   - 更新功能开关 (Admin)
  router.use('/', registerSettingSystemRoutes());

  return router;
}
