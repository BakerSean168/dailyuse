/**
 * Dashboard API Module Lifecycle Spec (RefArch Phase 6).
 * Dashboard API 模块生命周期测试（RefArch 阶段 6）。
 *
 * Verifies that `composeDashboardApiModule` is a transport/lifecycle adapter:
 * the read port and activity-ledger runtime are injected by the host, the
 * handle starts the same ledger listener on `register()` and stops it on
 * `destroy()`, and `register()` never touches a `db` context.
 *
 * 验证 `composeDashboardApiModule` 是传输/生命周期适配器：read port 与
 * activity-ledger runtime 由宿主注入，handle 在 `register()` 启动同一 ledger
 * 监听、在 `destroy()` 停止它，且 `register()` 绝不触碰 `db` 上下文。
 */

import { Router } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DashboardData } from '@memoflow/contracts/dashboard';
import type { IApiModuleContext } from '../../shared/contracts/api-module.js';
import { composeDashboardApiModule, type DashboardActivityLedgerRuntime } from './module';
import type { DashboardReadPort } from './dashboard-read-port';

function createFakeReadPort(): DashboardReadPort & { getDashboardData: ReturnType<typeof vi.fn> } {
  return {
    getDashboardData: vi.fn(async () => ({}) as unknown as DashboardData),
  };
}

function createFakeLedgerRuntime(): DashboardActivityLedgerRuntime & {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
} {
  return { start: vi.fn(), stop: vi.fn() };
}

function createContext(): IApiModuleContext {
  const router = Router();
  return {
    app: {} as IApiModuleContext['app'],
    router,
    middleware: {
      auth: (req, _res, next) => {
        (req as { user?: { identityId: string } }).user = { identityId: 'identity-1' };
        next();
      },
      requireRole: () => (_req, _res, next) => next(),
    },
  };
}

describe('composeDashboardApiModule (Phase 6)', () => {
  let readPort: ReturnType<typeof createFakeReadPort>;
  let ledger: ReturnType<typeof createFakeLedgerRuntime>;

  beforeEach(() => {
    readPort = createFakeReadPort();
    ledger = createFakeLedgerRuntime();
  });

  it('register mounts /dashboard/stats and starts the injected ledger runtime', async () => {
    const module = composeDashboardApiModule({
      dashboardReadPort: readPort,
      activityLedgerRuntime: ledger,
    });
    const context = createContext();
    module.register(context);

    expect(ledger.start).toHaveBeenCalledTimes(1);

    // Mount the private router to a fresh app and hit the stats route.
    const expressApp = await import('express').then((m) => m.default());
    expressApp.use('/api', context.router);

    const res = await request(expressApp).get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(readPort.getDashboardData).toHaveBeenCalledWith('identity-1');
  });

  it('destroy stops the same ledger listener and is idempotent', () => {
    const module = composeDashboardApiModule({
      dashboardReadPort: readPort,
      activityLedgerRuntime: ledger,
    });
    const context = createContext();
    module.register(context);

    module.destroy?.();
    module.destroy?.();

    expect(ledger.stop).toHaveBeenCalledTimes(1);
    expect(ledger.start).toHaveBeenCalledTimes(1);
  });

  it('destroy is a no-op when the ledger was never started', () => {
    const module = composeDashboardApiModule({
      dashboardReadPort: readPort,
      activityLedgerRuntime: ledger,
    });

    module.destroy?.();

    expect(ledger.stop).not.toHaveBeenCalled();
  });

  it('register() receives only the transport-only context (no db is read)', () => {
    const module = composeDashboardApiModule({
      dashboardReadPort: readPort,
      activityLedgerRuntime: ledger,
    });
    const context = createContext() as IApiModuleContext & { db?: unknown };
    // The context has no db; register must still work.
    delete (context as Record<string, unknown>).db;
    module.register(context);
    expect(ledger.start).toHaveBeenCalledTimes(1);
  });
});
