/**
 * Governance API Module
 *
 * 自治的 API 模块入口 — 通过 register() 暴露给 ApiBootstrapper：
 * - 内部完成 Composition Root 组装
 * - 通过 context.middleware 使用平台级中间件（auth, rbac）
 * - 通过 context.router 挂载路由
 *
 * apps/api 只需一行代码：
 * ```typescript
 * .register(GovernanceApiModule)
 * ```
 *
 * 路由前缀：
 * - /governance/rules
 */

export { GovernanceApiModule } from './module';