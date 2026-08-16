/**
 * Governance API Module Lifecycle Spec
 * 治理 API 模块生命周期测试
 *
 * Verifies that createGovernanceApiModule is a pure transport/lifecycle
 * adapter: it wires routes, starts the already-assembled instance, owns a
 * per-handle state machine (single registration, terminal states, idempotent
 * destroy), cleans up on start failure, and never touches `db`.
 *
 * 验证 createGovernanceApiModule 是纯传输/生命周期适配器：
 * 挂载路由、启动已装配实例、维护每个 handle 的状态机（单次注册、
 * 终态、destroy 幂等）、start 失败时清理，且完全不触碰 `db`。
 */

import type { Express, Router } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerModuleHandle, ServerTransportModuleContext } from '@memoflow/contracts/shared';
import type { GovernanceApplicationPort } from '../server/application';
import type { GovernanceModuleInstance } from '../server/infrastructure';
import { createGovernanceApiModule, type GovernanceApiModuleContext } from './module';

function createApiStub(): GovernanceApplicationPort {
  return {
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    getRule: vi.fn(),
    listRules: vi.fn(),
    searchRules: vi.fn(),
    getRevisions: vi.fn(),
  } as GovernanceApplicationPort;
}

/**
 * Fake GovernanceModuleInstance that also models a runtime event bus:
 * `publish` only records events while the runtime is running. This lets the
 * spec assert that after `dispose()` the runtime no longer receives events.
 *
 * 模拟 GovernanceModuleInstance，同时建模运行时事件总线：
 * 仅当 runtime 处于运行状态时 `publish` 才记录事件，
 * 从而断言 `dispose()` 之后运行时不再收到事件。
 */
function createFakeInstance() {
  const receivedEvents: string[] = [];
  let running = false;

  const start = vi.fn(() => {
    running = true;
  });
  const dispose = vi.fn(() => {
    running = false;
  });

  const instance: GovernanceModuleInstance = {
    api: createApiStub(),
    start,
    dispose,
  };

  return {
    instance,
    start,
    dispose,
    receivedEvents,
    publish(event: string) {
      if (running) {
        receivedEvents.push(event);
      }
    },
  };
}

function createFakeContext(): GovernanceApiModuleContext {
  return {
    app: {} as Express,
    router: { use: vi.fn() } as unknown as Router,
    middleware: {
      auth: vi.fn(),
      requireRole: vi.fn(() => vi.fn()),
    },
    openApiRegistry: {
      registerPath: vi.fn(),
      register: vi.fn(),
    },
  };
}

describe('createGovernanceApiModule lifecycle', () => {
  let fake: ReturnType<typeof createFakeInstance>;
  let context: GovernanceApiModuleContext;

  beforeEach(() => {
    fake = createFakeInstance();
    context = createFakeContext();
  });

  it('register wires routes once, starts once, and never touches db', () => {
    const moduleDef = createGovernanceApiModule({ instance: fake.instance });

    // No db property on the context: register must still work.
    // 上下文没有 db 属性：register 必须照常工作。
    const contextWithoutDb = { ...context } as GovernanceApiModuleContext;
    delete (contextWithoutDb as Record<string, unknown>).db;

    expect(() => moduleDef.register(contextWithoutDb)).not.toThrow();

    // registerGovernanceRoutes-equivalent ran once and mounted once.
    // 路由注册只执行一次，且只挂载一次。
    const routerUse = context.router.use as ReturnType<typeof vi.fn>;
    expect(routerUse).toHaveBeenCalledTimes(1);
    expect(routerUse).toHaveBeenCalledWith('/governance/rules', expect.anything());

    // The fake api was consumed by route building.
    // 路由构建消费了 fake api。
    expect(
      (context.openApiRegistry?.registerPath as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThan(0);

    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('throws on a second register() call (single registration per handle)', () => {
    const moduleDef = createGovernanceApiModule({ instance: fake.instance });

    moduleDef.register(context);
    expect(() => moduleDef.register(context)).toThrow(/only register once/);
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('throws on register() after destroy()', () => {
    const moduleDef = createGovernanceApiModule({ instance: fake.instance });

    moduleDef.register(context);
    moduleDef.destroy?.();

    expect(() => moduleDef.register(context)).toThrow(/only register once/);
  });

  it('destroy disposes exactly once and is idempotent', () => {
    const moduleDef = createGovernanceApiModule({ instance: fake.instance });

    moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);

    moduleDef.destroy?.();
    moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('disposes and rethrows when start() throws, leaving a handle that cannot be re-registered', () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });

    const moduleDef = createGovernanceApiModule({ instance: fake.instance });

    expect(() => moduleDef.register(context)).toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);

    expect(() => moduleDef.register(context)).toThrow(/only register once/);
    expect(fake.start).toHaveBeenCalledTimes(1);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('rethrows the original registration error even if dispose also throws', () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });
    fake.dispose.mockImplementation(() => {
      throw new Error('dispose failed');
    });

    const moduleDef = createGovernanceApiModule({ instance: fake.instance });

    expect(() => moduleDef.register(context)).toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('stops the runtime event handler after dispose', () => {
    const moduleDef = createGovernanceApiModule({ instance: fake.instance });

    moduleDef.register(context);
    fake.publish('rule.created');
    expect(fake.receivedEvents).toEqual(['rule.created']);

    moduleDef.destroy?.();
    fake.publish('rule.updated');
    expect(fake.receivedEvents).toEqual(['rule.created']);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });
});

describe('GovernanceApiModuleDef shared handle contract (Phase 6)', () => {
  it('the created handle is assignable to the shared ServerModuleHandle<ServerTransportModuleContext>', () => {
    const instance = createFakeInstance();
    const handle = createGovernanceApiModule({ instance: instance.instance });
    const sharedHandle: ServerModuleHandle<ServerTransportModuleContext> = handle;
    expect(sharedHandle.name).toBe('Governance');
    expect(typeof sharedHandle.register).toBe('function');
    expect(typeof sharedHandle.destroy).toBe('function');
  });

  it('the registration context exposes no db', () => {
    const ctx = createFakeContext();
    // @ts-expect-error GovernanceApiModuleContext carries no `db` property
    const _db: unknown = ctx.db;
    expect(_db).toBeUndefined();
  });

  it('a handle whose register requires a DB-bearing context is NOT assignable to the shared handle', () => {
    const dbRequiringHandle: ServerModuleHandle<ServerTransportModuleContext & { db: unknown }> = {
      name: 'DbHandle',
      register(_ctx: ServerTransportModuleContext & { db: unknown }): void {
        // A handle that needs `db` can never satisfy the transport-only contract.
      },
    };
    // @ts-expect-error register(context) must not accept a wider DB context
    const sharedHandle: ServerModuleHandle<ServerTransportModuleContext> = dbRequiringHandle;
    expect(sharedHandle).toBeDefined();
  });

  it('cannot be constructed without the required instance option', () => {
    // @ts-expect-error GovernanceApiModuleOptions requires the assembled `instance`
    createGovernanceApiModule({} as never);
  });

  it('the register() parameter type carries no db', () => {
    const handle = createGovernanceApiModule({ instance: createFakeInstance().instance });
    const assertContextType = (_ctx: Parameters<typeof handle.register>[0]): void => {
      // @ts-expect-error Parameters<register>[0] has no `db` property
      const _db: unknown = _ctx.db;
    };
    expect(assertContextType).toBeTypeOf('function');
  });
});
