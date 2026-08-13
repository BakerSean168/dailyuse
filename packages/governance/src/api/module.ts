/**
 * Governance API Transport Module Factory
 * 治理 API 传输模块工厂
 *
 * This module is a transport adapter, NOT a composition root:
 * it only wires an already-assembled `GovernanceModuleInstance` onto the
 * Express router and owns that instance's start/dispose lifecycle.
 *
 * 本模块是传输适配器，而不是组合根：
 * 它只负责把已装配好的 `GovernanceModuleInstance` 挂到 Express 路由上，
 * 并托管该实例的 start/dispose 生命周期。
 *
 * The host (apps/api) is responsible for composition: it selects the Prisma
 * adapters, builds repositories and the event-log runtime, calls
 * `createGovernanceModule(...)`, and passes the resulting instance in through
 * `GovernanceApiModuleOptions`. This factory never reads `context.db`, never
 * constructs repositories/use cases, and never starts a runtime adapter.
 *
 * 宿主（apps/api）负责组合：选择 Prisma 适配器、构建 repository 与
 * event-log runtime、调用 `createGovernanceModule(...)`，再把组装结果通过
 * `GovernanceApiModuleOptions` 传入。本工厂不读取 `context.db`，
 * 不创建 repository/use case，也不启动任何 runtime adapter。
 *
 * `instance.api` is the HTTP/IPC-shared application seam
 * (`GovernanceApplicationPort`). Both the API transport (this module) and the
 * Electron IPC transport consume the same port, so behaviour parity across
 * hosts is guaranteed by construction.
 *
 * `instance.api` 是 HTTP/IPC 共用的应用 seam（`GovernanceApplicationPort`）。
 * API 传输层（本模块）与 Electron IPC 传输层消费同一个 port，
 * 从而从构造上保证跨宿主行为一致。
 *
 * Lifecycle ownership:
 * - register(): builds routes from `instance.api`, mounts them at
 *   `/governance/rules`, then calls `instance.start()`. Route wiring happens
 *   BEFORE start, so a route-build failure leaves no runtime side effects.
 *   If route building or start throws, this factory best-effort disposes the
 *   instance before rethrowing, preventing listener leaks (plan §6.1).
 * - destroy(): calls `instance.dispose()` exactly once. It is idempotent and
 *   tolerates repeated calls; later calls are no-ops.
 *
 * 生命周期归属：
 * - register()：用 `instance.api` 构建路由并挂载到 `/governance/rules`，
 *   然后调用 `instance.start()`。路由先于 start 挂载，因此路由构建失败不会
 *   留下任何 runtime 副作用；若路由构建或 start 抛错，本工厂会在重新抛出前
 *   尽力 dispose 实例，避免 listener 泄漏（计划 §6.1）。
 * - destroy()：恰好调用一次 `instance.dispose()`，幂等，可安全重复调用；
 *   重复调用为 no-op。
 *
 * Repeated-call semantics: the instance is owned by the factory closure, not
 * by a package-level singleton. Re-registering the returned module handle does
 * not create a second instance; `started`/`disposed` flags are per-handle state.
 *
 * 重复调用语义：实例由工厂闭包持有，而不是包级 singleton。重复注册返回的
 * module handle 不会创建第二个实例；`started`/`disposed` 是每个 handle
 * 自己的状态。
 */

import type { ServerModuleContext } from '@memoflow/contracts/shared';
import type { GovernanceModuleInstance } from '../server/infrastructure';
import { registerGovernanceRoutes } from './routes';

/**
 * Transport-only context for governance registration.
 * Deliberately picks no `db`: the api module never needs persistence, and this
 * keeps the seam from becoming a second composition root.
 *
 * 治理注册的传输专用上下文。刻意不包含 `db`：API module 不需要持久化，
 * 这也避免该 seam 变成第二个组合根。
 */
export type GovernanceApiModuleContext = Pick<
  ServerModuleContext<unknown>,
  'app' | 'router' | 'middleware' | 'openApiRegistry'
>;

export interface GovernanceApiModuleDef {
  readonly name: string;
  register(context: GovernanceApiModuleContext): void;
  destroy?(): void;
}

export interface GovernanceApiModuleOptions {
  readonly instance: GovernanceModuleInstance;
}

export function createGovernanceApiModule(
  options: GovernanceApiModuleOptions,
): GovernanceApiModuleDef {
  let started = false;
  let disposed = false;

  return {
    name: 'Governance',

    register(context) {
      const { router, middleware, openApiRegistry } = context;

      try {
        const governanceRoutes = registerGovernanceRoutes(
          options.instance.api,
          middleware,
          openApiRegistry,
        );

        router.use('/governance/rules', governanceRoutes);

        if (!started) {
          options.instance.start();
          started = true;
        }
      } catch (error) {
        options.instance.dispose();
        throw error;
      }
    },

    destroy() {
      if (disposed) {
        return;
      }
      disposed = true;
      options.instance.dispose();
    },
  };
}
