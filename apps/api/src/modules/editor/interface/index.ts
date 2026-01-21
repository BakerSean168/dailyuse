/**
 * Editor Routes Aggregator
 * 聚合所有编辑器相关的 HTTP 路由
 *
 * 模块路由组织：
 * - /api/editor/config       - 编辑器配置和快捷键设置
 * - /api/editor/themes       - 编辑器主题和外观
 * - /                        - 编辑器主要功能（旧路由）
 */

import type { Router } from 'express';
import { Router as ExpressRouter } from 'express';
import { registerEditorConfigRoutes } from './editor-config.routes';
import { registerEditorThemeRoutes } from './editor-theme.routes';
// import { registerEditorDetailsRoutes } from './http/routes/editorRoutes';

export function registerEditorRoutes(): Router {
  const router: Router = ExpressRouter();

  // ============ 编辑器配置路由 ============
  router.use('/config', registerEditorConfigRoutes());

  // ============ 编辑器主题路由 ============
  router.use('/themes', registerEditorThemeRoutes());

  // ============ 编辑器主路由 ============
  // router.use('/', registerEditorDetailsRoutes()); // TODO: restore when editorRoutes is implemented

  return router;
}
