/**
 * Schedule API composition root spec.
 * 日程 API 组合根测试。
 *
 * Verifies composeSchedule():
 * - assembles schedule in the mandated plan §3.3 two-phase order
 *   (shared repository set → scheduler queue runtime → module instance → API module)
 * - builds the queue runtime from the SAME scheduleTaskRepository + leaseCoordinator
 *   instances handed to orchestration (identity lock)
 * - appends host runtime contributions after the module-owned queue runtime
 * - returns an already-bound IApiModule-compatible handle
 * - mounts /schedules + /schedules/events and starts the owned instance when registered
 *
 * 验证 composeSchedule()：
 * - 按计划 §3.3 两阶段顺序装配日程（共享仓储集合 → 调度器队列运行时 →
 *   module instance → API module）
 * - 用与编排完全相同的 scheduleTaskRepository + leaseCoordinator 实例构建队列运行时（身份锁定）
 * - 在模块自有队列运行时之后追加宿主运行时贡献
 * - 返回已绑定 instance 的、兼容 IApiModule 的 handle
 * - register() 挂载 /schedules 与 /schedules/events 并启动所属实例
 *
 * The ingredient factories are wrapped in vi.fn() so the spec can assert assembly
 * order and object identity, while delegating to the real implementations for
 * construction. The structural registration test swaps in a fake instance because
 * the real schedule module's start acquires a DB lease (impossible with a fake db).
 *
 * ingredient 工厂被包成 vi.fn() 以便断言装配顺序与对象身份，同时委托真实实现完成
 * 构造。结构注册测试改用 fake instance，因为真实 schedule module 的 start 会抢占
 * DB lease（fake db 无法完成）。
 */

import type { Express, Router } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleApiModuleContext } from '@memoflow/schedule/api';
import type { ScheduleRepositorySet, ScheduleTaskSourceExecutor } from '@memoflow/schedule';

vi.mock('@memoflow/schedule', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/schedule')>();
  return {
    ...actual,
    createScheduleModule: vi.fn(actual.createScheduleModule),
    createScheduleRuntimeContribution: vi.fn(actual.createScheduleRuntimeContribution),
  };
});

vi.mock('@memoflow/schedule/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/schedule/api')>();
  return {
    ...actual,
    createScheduleApiModule: vi.fn(actual.createScheduleApiModule),
  };
});

import { composeSchedule } from './compose-schedule';
import {
  createScheduleModule,
  createScheduleRuntimeContribution,
} from '@memoflow/schedule';
import { createScheduleApiModule } from '@memoflow/schedule/api';

const fakeSet = {
  scheduleRepository: {},
  scheduleExecutionRepository: {},
  scheduleTaskRepository: {},
  leaseCoordinator: {},
  auditRepository: {},
} as unknown as ScheduleRepositorySet;

const sourceExecutor: ScheduleTaskSourceExecutor = {
  execute: async () => ({ nextRunAt: null }),
};

const hostRuntime = { start: async () => {}, stop: () => {} };

describe('composeSchedule assembly order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assembles in plan §3.3 order: runtime contribution → module → api module', () => {
    composeSchedule({ repositories: fakeSet, sourceExecutor });

    const runtimeOrder = createScheduleRuntimeContribution.mock.invocationCallOrder[0];
    const moduleOrder = createScheduleModule.mock.invocationCallOrder[0];
    const apiModuleOrder = createScheduleApiModule.mock.invocationCallOrder[0];

    expect(runtimeOrder).toBeLessThan(moduleOrder);
    expect(moduleOrder).toBeLessThan(apiModuleOrder);
  });

  it('builds the queue runtime from the SAME scheduleTaskRepository + leaseCoordinator instances', () => {
    composeSchedule({ repositories: fakeSet, sourceExecutor });

    expect(createScheduleRuntimeContribution).toHaveBeenCalledWith({
      scheduleTaskRepository: fakeSet.scheduleTaskRepository,
      sourceExecutor,
      leaseCoordinator: fakeSet.leaseCoordinator,
      shouldScheduleTask: undefined,
    });

    const moduleCall = createScheduleModule.mock.calls[0][0];
    expect(moduleCall).toMatchObject({
      scheduleRepository: fakeSet.scheduleRepository,
      scheduleExecutionRepository: fakeSet.scheduleExecutionRepository,
      scheduleTaskRepository: fakeSet.scheduleTaskRepository,
      leaseCoordinator: fakeSet.leaseCoordinator,
      auditRepository: fakeSet.auditRepository,
    });
    expect(moduleCall.runtimeContributions).toContain(
      createScheduleRuntimeContribution.mock.results[0].value,
    );

    const instance = createScheduleModule.mock.results[0].value;
    expect(createScheduleApiModule).toHaveBeenCalledWith({ instance });
  });

  it('wires the Prisma delivery-log consumer through to the schedule module (merge-base P1-1)', () => {
    const deliveryLogConsumer = { start: vi.fn(), stop: vi.fn() };
    const setWithConsumer = {
      ...fakeSet,
      eventDeliveryLogConsumer: deliveryLogConsumer,
    } as unknown as ScheduleRepositorySet;

    composeSchedule({ repositories: setWithConsumer, sourceExecutor });

    expect(createScheduleModule).toHaveBeenCalledWith(
      expect.objectContaining({ eventDeliveryLogConsumer: deliveryLogConsumer }),
    );
  });

  it('appends host runtime contributions after the module-owned queue runtime', () => {
    composeSchedule({ repositories: fakeSet, sourceExecutor, runtimeContributions: hostRuntime });

    const moduleCall = createScheduleModule.mock.calls[0][0];
    const contributions = moduleCall.runtimeContributions as unknown[];
    const queueIndex = contributions.indexOf(
      createScheduleRuntimeContribution.mock.results[0].value,
    );
    const hostIndex = contributions.indexOf(hostRuntime);
    expect(queueIndex).toBeGreaterThanOrEqual(0);
    expect(hostIndex).toBeGreaterThan(queueIndex);
  });

  it('returns the module handle plus the unchanged shared repository set', () => {
    const composed = composeSchedule({ repositories: fakeSet, sourceExecutor });

    expect(composed.module).toMatchObject({ name: 'Schedule' });
    expect(typeof composed.module.register).toBe('function');
    expect(typeof composed.module.destroy).toBe('function');
    expect(composed.repositories).toBe(fakeSet);
  });
});

/**
 * Structural registration test using a fake instance.
 * 用 fake instance 的结构注册测试。
 *
 * The real schedule instance start acquires a DB lease (R3a), which cannot
 * succeed against a fake db, so createScheduleModule is swapped to return a
 * fake instance whose start/dispose are spies. The API handle then mounts
 * /schedules + /schedules/events after a successful start.
 *
 * 真实 schedule instance 的 start 会抢占 DB lease（R3a），fake db 无法完成，
 * 因此把 createScheduleModule 换成返回 fake instance（start/dispose 为 spy）。
 * API handle 随后在 start 成功后挂载 /schedules 与 /schedules/events。
 */
describe('composeSchedule structural registration', () => {
  let routerUse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    routerUse = vi.fn();
  });

  it('mounts /schedules + /schedules/events on the router and starts the owned instance', async () => {
    const start = vi.fn(async () => undefined);
    const dispose = vi.fn(async () => undefined);
    const fakeInstance = {
      scheduleRepository: {},
      scheduleExecutionRepository: {},
      scheduleTaskRepository: {},
      useCases: {},
      api: {
        createTask: vi.fn(),
        listTasks: vi.fn(),
        getTask: vi.fn(),
        getDueTasks: vi.fn(),
        pauseTask: vi.fn(),
        resumeTask: vi.fn(),
        completeTask: vi.fn(),
        cancelTask: vi.fn(),
        deleteTask: vi.fn(),
        batchDeleteTasks: vi.fn(),
        updateTaskMetadata: vi.fn(),
      },
      eventApi: {
        createEvent: vi.fn(),
        getEvent: vi.fn(),
        listEvents: vi.fn(),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn(),
        getConflicts: vi.fn(),
        detectConflicts: vi.fn(),
        createEventWithConflictDetection: vi.fn(),
        resolveConflict: vi.fn(),
      },
      start,
      dispose,
    };

    vi.mocked(createScheduleModule).mockReturnValueOnce(fakeInstance as never);

    const composed = composeSchedule({ repositories: fakeSet, sourceExecutor });

    const context: ScheduleApiModuleContext = {
      app: {} as Express,
      router: { use: routerUse, stack: [] } as unknown as Router,
      middleware: {
        auth: vi.fn(),
        requireRole: vi.fn(() => vi.fn()),
      },
      openApiRegistry: undefined,
    };

    await expect(composed.module.register(context)).resolves.toBeUndefined();
    expect(routerUse).toHaveBeenCalledWith('/schedules', expect.anything());
    expect(routerUse).toHaveBeenCalledWith('/schedules/events', expect.anything());

    expect(start).toHaveBeenCalledTimes(1);

    composed.module.destroy?.();
    await dispose;
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
