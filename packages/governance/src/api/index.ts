/**
 * Governance API Transport Module
 * 治理 API 传输模块
 *
 * Public seam for the governance HTTP transport. Exposes the
 * `createGovernanceApiModule` factory, which turns an already-assembled
 * `GovernanceModuleInstance` into an `IApiModule`-compatible handle:
 * route registration + lifecycle only. Composition lives in the host
 * (apps/api/src/runtime), not in this package.
 *
 * 治理 HTTP 传输的公开 seam。暴露 `createGovernanceApiModule` 工厂，
 * 把已装配的 `GovernanceModuleInstance` 变成兼容 `IApiModule` 的 handle：
 * 只负责路由注册与生命周期。组合发生在宿主（apps/api/src/runtime），
 * 不在本包。
 *
 * Route prefix: /governance/rules
 */

export {
  createGovernanceApiModule,
  type GovernanceApiModuleContext,
  type GovernanceApiModuleDef,
  type GovernanceApiModuleOptions,
} from './module';
