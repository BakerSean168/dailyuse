/**
 * Editor API Module Definition
 * 编辑器 API 模块定义
 *
 * Thin API module following the governance canonical pattern:
 * 遵循治理模块规范模式的薄 API 模块：
 *
 * 1. Composition Root — assemble dependencies via createEditorModule()
 *    组合根 — 通过 createEditorModule() 组装依赖
 * 2. Transport handlers — map module facade to controller port
 *    传输处理器 — 将模块门面映射到控制器端口
 * 3. Route registration — mount routes to Express router
 *    路由注册 — 将路由挂载到 Express 路由器
 *
 * All business logic lives in the composition root (editor.module.ts).
 * This file is pure plumbing.
 *
 * 所有业务逻辑都在组合根（editor.module.ts）中。
 * 此文件只是纯粹的管道连接。
 */

import type { Router, Express, RequestHandler } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import {
  createEditorModule,
  EditorWorkspacePrismaRepository,
  DocumentPrismaRepository,
  type EditorModuleInstance,
} from '../infrastructure-server';
import { registerEditorRoutes } from './routes';
import { createEditorTransportHandlers } from './transport-handlers';
import { createEditorRuntimeContribution } from './runtime';

// ---------------------------------------------------------------------------
// Module context — 模块注册上下文
// ---------------------------------------------------------------------------

/**
 * Registration context (structurally compatible with apps/api's IApiModuleContext).
 * 注册上下文（与 apps/api 的 IApiModuleContext 结构兼容）。
 *
 * Locally defined to avoid circular dependency on apps/api.
 * 在本地定义以避免对 apps/api 的循环依赖。
 */
export interface EditorApiModuleContext {
  readonly app: Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: RequestHandler;
    requireRole(roles: string[]): RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface EditorApiModuleDef {
  readonly name: string;
  register(context: EditorApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Module singleton — 模块单例
// ---------------------------------------------------------------------------

let activeEditorModule: EditorModuleInstance | null = null;

// ---------------------------------------------------------------------------
// API Module — API 模块
// ---------------------------------------------------------------------------

export const EditorApiModule: EditorApiModuleDef = {
  name: 'Editor',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — assemble dependencies (uses shared database singleton)
    //    组合根 — 组装依赖（使用共享数据库单例）
    const prismaClient = db as PrismaClient;
    const editorModule = createEditorModule({
      // The application edge decides which adapter implementation to use.
      // 应用边界决定使用哪个适配器实现。
      workspaceRepository: new EditorWorkspacePrismaRepository(prismaClient),
      documentRepository: new DocumentPrismaRepository(prismaClient),
      runtimeContributions: createEditorRuntimeContribution(),
    });
    activeEditorModule = editorModule;
    editorModule.start();

    // 2. Transport handlers — map module facade to controller port
    //    传输处理器 — 将模块门面映射到控制器端口
    const handlers = createEditorTransportHandlers(editorModule.api);

    // 3. Route registration — mount routes (module decides its own prefix)
    //    路由注册 — 挂载路由（模块自决前缀）
    const editorRoutes = registerEditorRoutes(handlers, middleware, context.openApiRegistry);
    router.use('/editor', editorRoutes);
  },

  destroy() {
    activeEditorModule?.dispose();
    activeEditorModule = null;
  },
};
