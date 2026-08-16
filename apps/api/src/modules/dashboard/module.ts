/**
 * Dashboard API Module
 *
 * Aggregation endpoint that returns combined statistics from all modules.
 * This is infrastructure-level (not a domain concern) since it aggregates
 * read-only data across multiple bounded contexts.
 *
 * RefArch Phase 6: `DashboardApiModule` became `composeDashboardApiModule
 * ({ dashboardReadPort, activityLedgerRuntime })`. The DB-backed read adapter
 * and the activity-ledger listener runtime are assembled by the host runtime;
 * the handle starts the same ledger listener on `register()` and stops it on
 * `destroy()`, and `register()` only mounts routes against the transport-only
 * context (no `db`).
 *
 * RefArch 阶段 6：`DashboardApiModule` 改为 `composeDashboardApiModule
 * ({ dashboardReadPort, activityLedgerRuntime })`。DB-backed 读取 adapter 与
 * activity-ledger 监听 runtime 由宿主 runtime 组装；handle 在 `register()`
 * 启动同一 ledger 监听、在 `destroy()` 停止它，`register()` 只针对仅含
 * transport 的上下文（无 `db`）挂载路由。
 */

import { Router } from 'express';
import type { IApiModule, IApiModuleContext } from '../../shared/contracts/api-module.js';
import type { AuthenticatedRequest } from '../../shared/infrastructure/http/middlewares/auth-middleware.js';
import { createApiResponseBuilder } from '../../shared/infrastructure/http/response-builder.js';
import type { DashboardReadPort } from './dashboard-read-port.js';

/**
 * Runtime owning the activity-ledger listener lifecycle.
 * 拥有 activity-ledger 监听器生命周期的 runtime。
 */
export interface DashboardActivityLedgerRuntime {
  /** Subscribes the durable ledger listeners. 订阅 durable ledger 监听器。 */
  start(): void;
  /** Unsubscribes the durable ledger listeners (idempotent). 退订 durable ledger 监听器（幂等）。 */
  stop(): void;
}

/**
 * Options for `composeDashboardApiModule`.
 * `composeDashboardApiModule` 的选项。
 */
export interface ComposeDashboardApiModuleOptions {
  /**
   * Aggregated read port bound by the host runtime — never `context.db`.
   * 由宿主 runtime 绑定的聚合读取 Port——绝不是 `context.db`。
   */
  readonly dashboardReadPort: DashboardReadPort;
  /**
   * Activity-ledger listener runtime; the handle starts/stops the same
   * listener with `register()`/`destroy()`.
   * Activity-ledger 监听 runtime；handle 用 `register()`/`destroy()` 启动/停止
   * 同一监听器。
   */
  readonly activityLedgerRuntime: DashboardActivityLedgerRuntime;
}

/**
 * Creates the app-local Dashboard module handle with read port and ledger
 * runtime bound in the factory closure.
 * 创建在工厂闭包中绑定 read port 与 ledger runtime 的 app-local Dashboard
 * 模块 handle。
 *
 * @param options - Options carrying the assembled read port and ledger runtime.
 * @returns An `IApiModule` handle that mounts routes and owns the ledger listener.
 */
export function composeDashboardApiModule(options: ComposeDashboardApiModuleOptions): IApiModule {
  let ledgerStarted = false;

  return {
    name: 'Dashboard',

    register(context: IApiModuleContext) {
      const { router, middleware } = context;
      const dashboardRouter = Router();

      // Start the durable ledger listener that this handle owns; destroy()
      // stops the same listener.
      options.activityLedgerRuntime.start();
      ledgerStarted = true;

      // GET /dashboard/stats — Aggregated dashboard statistics
      dashboardRouter.get('/stats', middleware.auth, async (req, res) => {
        const responseBuilder = createApiResponseBuilder(req);

        try {
          const authReq = req as AuthenticatedRequest;
          const identityId = authReq.user?.identityId;

          if (!identityId) {
            res.status(401).json(responseBuilder.unauthorized('未授权，请登录'));
            return;
          }

          const data = await options.dashboardReadPort.getDashboardData(identityId);

          res.json(responseBuilder.success(data, 'Success'));
        } catch (_err) {
          res.status(500).json(responseBuilder.internalError('Failed to fetch dashboard stats'));
        }
      });

      router.use('/dashboard', dashboardRouter);
    },

    destroy() {
      if (ledgerStarted) {
        options.activityLedgerRuntime.stop();
        ledgerStarted = false;
      }
    },
  };
}
