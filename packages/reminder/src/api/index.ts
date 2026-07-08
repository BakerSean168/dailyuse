/**
 * Reminder API Module.
 * 提醒 API 模块。
 *
 * Self-contained API module entry point — exposed to ApiBootstrapper via register():
 * 自治的 API 模块入口 — 通过 register() 暴露给 ApiBootstrapper：
 * - Internally completes Composition Root assembly
 *   内部完成组合根组装
 * - Uses platform middleware via context.middleware (auth, rbac)
 *   通过 context.middleware 使用平台级中间件（auth, rbac）
 * - Mounts routes via context.router
 *   通过 context.router 挂载路由
 *
 * apps/api only needs one line:
 * ```typescript
 * .register(ReminderApiModule)
 * ```
 *
 * Route prefix: /reminders
 * 路由前缀：/reminders
 */

export { ReminderApiModule } from './module';
export type { ReminderApiModuleContext, ReminderApiModuleDef } from './module';
