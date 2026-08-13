/**
 * Governance API composition root spec.
 * 治理 API 组合根测试。
 *
 * Verifies composeGovernance():
 * - assembles governance in the mandated plan §3.1 order
 *   (repositories → event-log runtime → module instance → API module)
 * - returns an already-bound IApiModule-compatible handle
 * - mounts governance routes and starts the owned instance when registered
 *
 * 验证 composeGovernance()：
 * - 按计划 §3.1 顺序装配治理（repositories → event-log runtime → module instance → API module）
 * - 返回已绑定 instance 的、兼容 IApiModule 的 handle
 * - register() 挂载治理路由并启动所属实例
 *
 * The four ingredient factories are wrapped in vi.fn() so the spec can assert
 * assembly order, while delegating to the real implementations so the
 * structural registration test runs against genuine factories with a fake db.
 *
 * 四个 ingredient factory 被包成 vi.fn() 以便断言装配顺序，同时委托真实实现，
 * 使结构注册测试用真实工厂 + fake db 运行。
 */

import type { Express, Router } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { GovernanceApiModuleContext } from '@memoflow/governance/api';

vi.mock('@memoflow/governance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/governance')>();
  return {
    ...actual,
    createGovernanceEventLogRuntime: vi.fn(actual.createGovernanceEventLogRuntime),
    createGovernanceModule: vi.fn(actual.createGovernanceModule),
    createGovernancePrismaRepositories: vi.fn(actual.createGovernancePrismaRepositories),
  };
});

vi.mock('@memoflow/governance/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/governance/api')>();
  return {
    ...actual,
    createGovernanceApiModule: vi.fn(actual.createGovernanceApiModule),
  };
});

import { composeGovernance } from './compose-governance';
import {
  createGovernanceEventLogRuntime,
  createGovernanceModule,
  createGovernancePrismaRepositories,
} from '@memoflow/governance';
import { createGovernanceApiModule } from '@memoflow/governance/api';

const fakeDb = {} as unknown as PrismaClient;

describe('composeGovernance assembly order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assembles in plan §3.1 order: repositories → event-log runtime → module → api module', () => {
    composeGovernance({ db: fakeDb });

    const prismaOrder = createGovernancePrismaRepositories.mock.invocationCallOrder[0];
    const runtimeOrder = createGovernanceEventLogRuntime.mock.invocationCallOrder[0];
    const moduleOrder = createGovernanceModule.mock.invocationCallOrder[0];
    const apiModuleOrder = createGovernanceApiModule.mock.invocationCallOrder[0];

    // repositories → event-log runtime → createGovernanceModule → createGovernanceApiModule
    // repositories → event-log runtime → createGovernanceModule → createGovernanceApiModule
    expect(prismaOrder).toBeLessThan(runtimeOrder);
    expect(runtimeOrder).toBeLessThan(moduleOrder);
    expect(moduleOrder).toBeLessThan(apiModuleOrder);
  });

  it('passes the fake db into the repository factory and the assembled instance into the api module', () => {
    composeGovernance({ db: fakeDb });

    expect(createGovernancePrismaRepositories).toHaveBeenCalledWith(fakeDb);

    const moduleCall = createGovernanceModule.mock.calls[0][0];
    expect(moduleCall).toMatchObject({
      ruleRepository: expect.anything(),
      revisionRepository: expect.anything(),
      runtimeAdapters: expect.anything(),
    });

    const instance = createGovernanceModule.mock.results[0].value;
    expect(createGovernanceApiModule).toHaveBeenCalledWith({ instance });
  });

  it('returns a module handle with name Governance plus register and destroy', () => {
    const handle = composeGovernance({ db: fakeDb });

    expect(handle).toMatchObject({ name: 'Governance' });
    expect(typeof handle.register).toBe('function');
    expect(typeof handle.destroy).toBe('function');
  });
});

/**
 * Structural registration test using real factories and a fake db.
 * 用真实工厂 + fake db 的结构注册测试。
 *
 * Real factories: RulePrismaRepository/RuleRevisionPrismaRepository only hold
 * the db reference (no queries at construction), and the event-log runtime has
 * no DB access at start, so registering with a fake db succeeds.
 *
 * 真实工厂下：Prisma repository 构造时只持有 db 引用（无查询），
 * event-log runtime 在 start 时也无数据库访问，因此用 fake db 注册可成功。
 */
describe('composeGovernance structural registration', () => {
  let routerUse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    routerUse = vi.fn();
  });

  it('mounts governance routes on the router and starts the owned instance', () => {
    const handle = composeGovernance({ db: fakeDb });

    const instance = createGovernanceModule.mock.results[0].value;
    const startSpy = vi.spyOn(instance, 'start');
    const disposeSpy = vi.spyOn(instance, 'dispose');

    const context: GovernanceApiModuleContext = {
      app: {} as Express,
      router: { use: routerUse } as unknown as Router,
      middleware: {
        auth: vi.fn(),
        requireRole: vi.fn(() => vi.fn()),
      },
      openApiRegistry: undefined,
    };

    expect(() => handle.register(context)).not.toThrow();
    expect(routerUse).toHaveBeenCalledWith('/governance/rules', expect.anything());

    expect(startSpy).toHaveBeenCalledTimes(1);

    handle.destroy?.();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});
