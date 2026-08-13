/**
 * Governance Electron Transport Module Factory
 * 治理 Electron 传输模块工厂
 *
 * This module is a transport adapter, NOT a composition root:
 * it only wires an already-assembled `GovernanceModuleInstance` onto
 * Electron's `ipcMain` and owns that instance's start/dispose lifecycle.
 *
 * 本模块是传输适配器，而不是组合根：
 * 它只负责把已装配好的 `GovernanceModuleInstance` 挂到 Electron 的
 * `ipcMain` 上，并托管该实例的 start/dispose 生命周期。
 *
 * The host (apps/desktop) is responsible for composition: it selects the
 * PowerSync adapters, builds repositories and the event-log runtime, calls
 * `createGovernanceModule(...)`, and passes the resulting instance in through
 * `GovernanceElectronModuleOptions`. This factory never reads `context.db`,
 * never constructs repositories/use cases, and never starts a runtime adapter.
 *
 * 宿主（apps/desktop）负责组合：选择 PowerSync 适配器、构建 repository 与
 * event-log runtime、调用 `createGovernanceModule(...)`，再把组装结果通过
 * `GovernanceElectronModuleOptions` 传入。本工厂不读取 `context.db`，
 * 不创建 repository/use case，也不启动任何 runtime adapter。
 *
 * `instance.api` is the HTTP/IPC-shared application seam
 * (`GovernanceApplicationPort`). Both the Express API transport and this
 * Electron IPC transport consume the same port, so behaviour parity across
 * hosts is guaranteed by construction.
 *
 * `instance.api` 是 HTTP/IPC 共用的应用 seam（`GovernanceApplicationPort`）。
 * Express API 传输层与本 Electron IPC 传输层消费同一个 port，
 * 从而从构造上保证跨宿主行为一致。
 *
 * Lifecycle ownership:
 * - register(): builds the controller from `instance.api`, registers all IPC
 *   handlers, then calls `instance.start()`. Channel registration happens
 *   BEFORE start, so a handler-build failure leaves no runtime side effects.
 *   If channel registration or start throws, this factory best-effort disposes
 *   the instance before rethrowing, preventing listener leaks (plan §6.1).
 * - destroy(): removes all IPC handlers, then calls `instance.dispose()`
 *   exactly once. It is idempotent and tolerates repeated calls; later calls
 *   are no-ops.
 *
 * 生命周期归属：
 * - register()：用 `instance.api` 构建 controller、注册全部 IPC handler，
 *   然后调用 `instance.start()`。handler 先于 start 注册，因此 handler
 *   注册失败不会留下任何 runtime 副作用；若 handler 注册或 start 抛错，
 *   本工厂会在重新抛出前尽力 dispose 实例，避免 listener 泄漏（计划 §6.1）。
 * - destroy()：移除全部 IPC handler，然后恰好调用一次 `instance.dispose()`，
 *   幂等，可安全重复调用；重复调用为 no-op。
 *
 * Repeated-call semantics: the instance is owned by the factory closure, not
 * by a package-level singleton. Re-registering the returned module handle does
 * not create a second instance; `started`/`disposed` flags are per-handle state.
 *
 * 重复调用语义：实例由工厂闭包持有，而不是包级 singleton。重复注册返回的
 * module handle 不会创建第二个实例；`started`/`disposed` 是每个 handle
 * 自己的状态。
 */

import { ipcMain } from 'electron';
import { ok } from '@memoflow/contracts/result';
import { createLogger } from '@memoflow/utils/logger';
import type { IElectronModuleContext } from '@memoflow/contracts/electron';
import {
  GovernanceChannels,
  type CreateRuleReq,
  type DeleteRuleReq,
  type GetRuleReq,
  type GetRuleRevisionsQueryInput,
  type GovernanceRpcRequest,
  type ListRulesQueryInput,
  type SearchRulesQueryInput,
} from '@memoflow/contracts/governance';
import { GovernanceController } from '../server/transport/governance.controller';
import type { GovernanceModuleInstance } from '../server/infrastructure';
import { withAuthenticatedValue } from './authenticated-ipc';

const logger = createLogger('GovernanceElectron');
const channels = Object.values(GovernanceChannels);

/**
 * Governance Electron module handle.
 * 治理 Electron 模块 handle。
 *
 * Structurally compatible with `IElectronModule` from
 * `@memoflow/contracts/electron`, but defined locally so this seam stays
 * host-shaped: the factory returns it already bound to one instance.
 *
 * 与 `@memoflow/contracts/electron` 的 `IElectronModule` 结构兼容，
 * 但在本地定义，使该 seam 保持宿主形状：工厂返回时已绑定到单个实例。
 */
export interface GovernanceElectronModuleDef {
  readonly name: string;
  register(context: IElectronModuleContext): void;
  destroy?(): void;
}

/**
 * Options carrying the already-assembled governance instance.
 * 携带已装配治理实例的选项。
 */
export interface GovernanceElectronModuleOptions {
  readonly instance: GovernanceModuleInstance;
}

/**
 * Creates the governance Electron transport module handle.
 * 创建治理 Electron 传输模块 handle。
 *
 * Turns an already-assembled `GovernanceModuleInstance` into an
 * `IElectronModule`-compatible handle. The handle is a transport adapter, not a
 * composition root: it only registers IPC channels and owns start/dispose
 * lifecycle. IPC channel names, payload schemas, controller methods and
 * response envelopes are unchanged — see the handler registrations below.
 *
 * 把已装配的 `GovernanceModuleInstance` 变成兼容 `IElectronModule` 的 handle。
 * 该 handle 是传输适配器而非组合根：只注册 IPC 通道并托管 start/dispose
 * 生命周期。IPC 通道名、payload schema、controller 方法与响应信封均保持不变——
 * 见下方各 handler 注册。
 *
 * @param options - Options carrying the assembled governance instance.
 * @returns An IElectronModule-compatible handle bound to the instance.
 */
export function createGovernanceElectronModule(
  options: GovernanceElectronModuleOptions,
): GovernanceElectronModuleDef {
  let started = false;
  let disposed = false;

  return {
    name: 'Governance',

    register(ctx) {
      const controller = new GovernanceController(options.instance.api);

      try {
        ipcMain.handle(
          GovernanceChannels.RULE_LIST,
          (_event, query: ListRulesQueryInput = {}) => controller.listRules(query),
        );

        ipcMain.handle(GovernanceChannels.RULE_GET, (_event, req: GetRuleReq) =>
          controller.getRule(req),
        );

        ipcMain.handle(GovernanceChannels.RULE_SEARCH, (_event, query: SearchRulesQueryInput) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            controller.searchRules(query, requestContext),
          ),
        );

        ipcMain.handle(GovernanceChannels.RULE_CREATE, (_event, req: CreateRuleReq) =>
          withAuthenticatedValue(ctx, async (requestContext) =>
            controller.createRule(req, requestContext),
          ),
        );

        ipcMain.handle(
          GovernanceChannels.RULE_UPDATE,
          (_event, payload: GovernanceRpcRequest<typeof GovernanceChannels.RULE_UPDATE>) =>
            withAuthenticatedValue(ctx, async (requestContext) =>
              controller.updateRule(payload, requestContext),
            ),
        );

        ipcMain.handle(GovernanceChannels.RULE_DELETE, (_event, payload: DeleteRuleReq) =>
          withAuthenticatedValue(ctx, async (requestContext) => {
            const result = await controller.deleteRule(payload, requestContext);
            if (!result.ok) return result;
            return ok(null);
          }),
        );

        ipcMain.handle(
          GovernanceChannels.RULE_REVISIONS,
          (_event, payload: GetRuleRevisionsQueryInput) => controller.getRevisions(payload),
        );

        if (!started) {
          options.instance.start();
          started = true;
        }

        logger.info('Governance module registered');
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

      for (const channel of channels) {
        ipcMain.removeHandler(channel);
      }

      options.instance.dispose();
      logger.info('Governance module destroyed');
    },
  };
}
