/**
 * Editor API Module
 * 编辑器 API 模块
 *
 * Self-contained API module entry — exposed to ApiBootstrapper via register():
 * 自治的 API 模块入口 — 通过 register() 暴露给 ApiBootstrapper：
 * - Internally assembles Composition Root
 *   内部完成组合根组装
 * - Uses platform-level middleware via context.middleware (auth, rbac)
 *   通过 context.middleware 使用平台级中间件（auth, rbac）
 * - Mounts routes via context.router
 *   通过 context.router 挂载路由
 *
 * apps/api only needs one line:
 * ```typescript
 * .register(EditorApiModule)
 * ```
 *
 * Route prefix: /editor
 */

export { EditorApiModule } from './module';
export type { EditorApiModuleContext, EditorApiModuleDef } from './module';
export { EditorController, type EditorUseCases } from '../controllers';
