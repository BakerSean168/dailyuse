/**
 * Goal API Transport Module Factory
 * 目标 API 传输模块工厂
 *
 * This module is a transport adapter, NOT a composition root:
 * it only wires an already-assembled `GoalModuleInstance` onto the Express
 * router and owns that instance's start/dispose lifecycle.
 *
 * 本模块是传输适配器，而不是组合根：
 * 它只负责把已装配好的 `GoalModuleInstance` 挂到 Express 路由上，
 * 并托管该实例的 start/dispose 生命周期。
 *
 * The host (apps/api) is responsible for composition: it selects the Prisma
 * adapters, builds repositories, runtime contributions and the Task-binding
 * read port, calls `createGoalModule(...)`, and passes the resulting instance
 * in through `GoalApiModuleOptions`. This factory never reads `context.db`,
 * never constructs repositories/use cases, and never starts a runtime adapter.
 *
 * 宿主（apps/api）负责组合：选择 Prisma 适配器、构建 repository、
 * runtime contribution 与 Task-binding read port、调用 `createGoalModule(...)`，
 * 再把组装结果通过 `GoalApiModuleOptions` 传入。本工厂不读取 `context.db`，
 * 不创建 repository/use case，也不启动任何 runtime adapter。
 *
 * `instance.api` is the HTTP/IPC-shared application seam
 * (`GoalApplicationPort`). Both the API transport (this module) and the
 * Electron IPC transport consume the same port, so behaviour parity across
 * hosts is guaranteed by construction.
 *
 * `instance.api` 是 HTTP/IPC 共用的应用 seam（`GoalApplicationPort`）。
 * API 传输层（本模块）与 Electron IPC 传输层消费同一个 port，
 * 从而从构造上保证跨宿主行为一致。
 *
 * Per-handle state machine (`created -> registered | failed`, then any state
 * -> `disposed`):
 * - register(): only allowed from `created`. Builds routes from `instance.api`
 *   and mounts them at `/goals` and `/goal-folders`, then calls
 *   `instance.start()` — route wiring happens BEFORE start, so a route-build
 *   failure leaves no runtime side effects. On success the handle moves to
 *   `registered`; a second register() throws. On any failure it cleans up
 *   (best-effort dispose, logged if dispose itself throws), moves to `failed`,
 *   and rethrows the ORIGINAL error. A failed handle must not be re-registered.
 * - destroy(): always allowed and always idempotent. The state is set to
 *   `disposed` BEFORE `instance.dispose()` runs, so a reentrant/retry destroy
 *   stays a no-op even if dispose throws (destroy may propagate that error).
 *
 * 每个 handle 的状态机（`created -> registered | failed`，之后任意状态 ->
 * `disposed`）：
 * - register()：仅允许从 `created` 进入。用 `instance.api` 构建路由并挂载到
 *   `/goals` 与 `/goal-folders`，然后调用 `instance.start()`——路由先于 start
 *   挂载，因此路由构建失败不会留下任何 runtime 副作用。成功则进入
 *   `registered`，重复 register() 抛错；任何失败先清理（best-effort dispose，
 *   若 dispose 自身抛错则记录日志），进入 `failed` 并重新抛出原始错误。
 *   failed 的 handle 不得再次注册。
 * - destroy()：任何状态都允许，且始终幂等。在 `instance.dispose()` 执行前
 *   先把状态置为 `disposed`，因此即使 dispose 抛错（该错误可向外传播），
 *   重入/重试 destroy 仍为 no-op。
 *
 * The instance is owned by the factory closure, not by a package-level
 * singleton. Re-registering the returned module handle does not create a second
 * instance; the explicit state machine above is per-handle state.
 *
 * 实例由工厂闭包持有，而不是包级 singleton。重复注册返回的 module handle
 * 不会创建第二个实例；上述显式状态机即每个 handle 自己的状态。
 */

import type { ServerModuleContext } from '@memoflow/contracts/shared';
import { createLogger } from '@memoflow/utils/logger';
import type { GoalModuleInstance } from '../server/infrastructure';
import {
  createGoalFolderTransportHandlers,
  createGoalTransportHandlers,
} from '../server/transport';
import { registerGoalFolderRoutes, registerGoalRoutes } from './routes';

const logger = createLogger('GoalApi');

/**
 * Per-handle lifecycle state. Only 'created' may enter 'registered' (or
 * 'failed' on a registration error); any state may end in 'disposed'.
 *
 * 每个 handle 的生命周期状态。只有 'created' 可以进入 'registered'
 * （或注册失败时进入 'failed'）；任意状态都可以结束于 'disposed'。
 */
type ModuleHandleState = 'created' | 'registered' | 'disposed' | 'failed';

/**
 * Transport-only context for goal registration.
 * Deliberately picks no `db`: the api module never needs persistence, and this
 * keeps the seam from becoming a second composition root.
 *
 * 目标注册的传输专用上下文。刻意不包含 `db`：API module 不需要持久化，
 * 这也避免该 seam 变成第二个组合根。
 */
export type GoalApiModuleContext = Pick<
  ServerModuleContext<unknown>,
  'app' | 'router' | 'middleware' | 'openApiRegistry'
>;

export interface GoalApiModuleDef {
  readonly name: string;
  register(context: GoalApiModuleContext): void;
  destroy?(): void;
}

export interface GoalApiModuleOptions {
  readonly instance: GoalModuleInstance;
}

/**
 * Creates the goal API transport module handle.
 * 创建目标 API 传输模块 handle。
 *
 * Turns an already-assembled `GoalModuleInstance` into an
 * `IApiModule`-compatible handle. The handle is a transport adapter, not a
 * composition root: it only registers routes and owns start/dispose lifecycle.
 *
 * 把已装配的 `GoalModuleInstance` 变成兼容 `IApiModule` 的 handle。
 * 该 handle 是传输适配器而非组合根：只注册路由并托管 start/dispose 生命周期。
 *
 * @param options - Options carrying the assembled goal instance.
 * @returns An IApiModule-compatible handle bound to the instance.
 */
export function createGoalApiModule(options: GoalApiModuleOptions): GoalApiModuleDef {
  if (!options?.instance) {
    throw new Error('[FAIL-CLOSED] createGoalApiModule requires options.instance');
  }
  let state: ModuleHandleState = 'created';

  return {
    name: 'Goal',

    register(context) {
      if (state !== 'created') {
        throw new Error(
          `GoalApiModule.register() called while in '${state}' state; a handle may only register once from 'created'`,
        );
      }

      const { router, middleware, openApiRegistry } = context;

      try {
        const goalHandlers = createGoalTransportHandlers(options.instance.api);
        const folderHandlers = createGoalFolderTransportHandlers(options.instance.api);

        const goalRoutes = registerGoalRoutes(goalHandlers, middleware, openApiRegistry);
        router.use('/goals', goalRoutes);

        const folderRoutes = registerGoalFolderRoutes(
          folderHandlers,
          middleware,
          openApiRegistry,
        );
        router.use('/goal-folders', folderRoutes);

        options.instance.start();
        state = 'registered';
      } catch (error) {
        state = 'failed';
        try {
          options.instance.dispose();
        } catch (disposeError) {
          logger.error(
            'GoalApiModule: instance dispose failed during failed registration',
            disposeError,
          );
        }
        throw error;
      }
    },

    destroy() {
      if (state === 'disposed') {
        return;
      }
      state = 'disposed';
      options.instance.dispose();
    },
  };
}
