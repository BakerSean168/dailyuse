/**
 * Notification API Module
 * 通知 API 模块
 *
 * 自治的 API 模块入口 — 通过 register() 暴露给 ApiBootstrapper：
 * - 内部完成 Composition Root 组装
 * - 通过 context.middleware 使用平台级中间件（auth, rbac）
 * - 通过 context.router 挂载路由
 *
 * apps/api 只需一行代码：
 * ```typescript
 * .register(NotificationApiModule)
 * ```
 *
 * Transport 注入（P0-3）：生产接线处可通过 `NotificationApiModuleContext` 的
 * `desktopTransport` / `pushTransport` 字段注入真实 transport，使 Desktop/Push
 * capability 可用；不注入则保持 fail-closed（production 启动对缺失 capability
 * fail-fast，绝不伪造成功）。示例（bootstrapper 构造 context 时附带字段）：
 * ```typescript
 * const context = {
 *   ...baseContext,
 *   desktopTransport: createDefaultElectronDesktopTransport(),
 *   pushTransport: createPushTransport(),
 * };
 * bootstrapper.register(NotificationApiModule).initWithContext(context);
 * ```
 *
 * 路由前缀：/notifications
 */

export { createNotificationApiModule } from './module';
export type { NotificationApiModuleContext, NotificationApiModuleDef, NotificationApiModuleOptions } from './module';
