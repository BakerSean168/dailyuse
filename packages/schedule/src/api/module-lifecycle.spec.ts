/**
 * Schedule API Module Lifecycle Spec
 * 日程 API 模块生命周期测试
 *
 * Verifies that createScheduleApiModule is a pure transport/lifecycle adapter:
 * it builds BOTH route objects before start, starts the already-assembled
 * instance, mounts `/schedules` and `/schedules/events` only after successful
 * start, owns a per-handle state machine (single registration, terminal
 * states, idempotent destroy), cleans up on start failure, and never touches
 * `db`.
 *
 * 验证 createScheduleApiModule 是纯传输/生命周期适配器：
 * 在 start 之前构建两组路由对象、启动已装配实例、仅在 start 成功后挂载
 * `/schedules` 与 `/schedules/events`、维护每个 handle 的状态机（单次注册、
 * 终态、destroy 幂等）、start 失败时清理，且完全不触碰 `db`。
 */

import type { Express, Router } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScheduleModuleInstance } from '../server/infrastructure';
import { createScheduleApiModule, type ScheduleApiModuleContext } from './module';

function createFakeInstance() {
  const api = {
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
  };
  const eventApi = {
    createEvent: vi.fn(),
    getEvent: vi.fn(),
    listEvents: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    getConflicts: vi.fn(),
    detectConflicts: vi.fn(),
    createEventWithConflictDetection: vi.fn(),
    resolveConflict: vi.fn(),
  };
  const start = vi.fn(async () => undefined);
  const dispose = vi.fn(async () => undefined);
  const instance: ScheduleModuleInstance = {
    scheduleRepository: {} as never,
    scheduleExecutionRepository: {} as never,
    scheduleTaskRepository: {} as never,
    useCases: {} as never,
    api,
    eventApi,
    start,
    dispose,
  } as ScheduleModuleInstance;
  return { instance, api, eventApi, start, dispose };
}

function createFakeContext(): ScheduleApiModuleContext {
  return {
    app: {} as Express,
    router: { use: vi.fn(), stack: [] } as unknown as Router,
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

describe('createScheduleApiModule lifecycle', () => {
  let fake: ReturnType<typeof createFakeInstance>;
  let context: ScheduleApiModuleContext;

  beforeEach(() => {
    fake = createFakeInstance();
    context = createFakeContext();
  });

  it('register wires both route groups once, starts once, and never touches db', async () => {
    const moduleDef = createScheduleApiModule({ instance: fake.instance });

    // No db property on the context: register must still work.
    // 上下文没有 db 属性：register 必须照常工作。
    const contextWithoutDb = { ...context } as ScheduleApiModuleContext;
    delete (contextWithoutDb as Record<string, unknown>).db;

    await expect(moduleDef.register(contextWithoutDb)).resolves.toBeUndefined();

    // Both schedule route groups mounted once, at their exact prefixes.
    // 两组路由各挂载一次，且使用精确前缀。
    const routerUse = context.router.use as ReturnType<typeof vi.fn>;
    expect(routerUse).toHaveBeenCalledTimes(2);
    expect(routerUse).toHaveBeenCalledWith('/schedules', expect.anything());
    expect(routerUse).toHaveBeenCalledWith('/schedules/events', expect.anything());

    expect(
      (context.openApiRegistry?.registerPath as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBeGreaterThan(0);

    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('throws on a second register() call (single registration per handle)', async () => {
    const moduleDef = createScheduleApiModule({ instance: fake.instance });

    await moduleDef.register(context);
    await expect(moduleDef.register(context)).rejects.toThrow(/only register once/);
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('throws on register() after destroy()', async () => {
    const moduleDef = createScheduleApiModule({ instance: fake.instance });

    await moduleDef.register(context);
    moduleDef.destroy?.();

    await expect(moduleDef.register(context)).rejects.toThrow(/only register once/);
  });

  it('destroy disposes exactly once and is idempotent', async () => {
    const moduleDef = createScheduleApiModule({ instance: fake.instance });

    moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);

    moduleDef.destroy?.();
    moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('disposes and rethrows when start() throws, leaving a handle that cannot be re-registered', async () => {
    fake.start.mockImplementation(async () => {
      throw new Error('start failed');
    });

    const moduleDef = createScheduleApiModule({ instance: fake.instance });

    await expect(moduleDef.register(context)).rejects.toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);

    await expect(moduleDef.register(context)).rejects.toThrow(/only register once/);
    expect(fake.start).toHaveBeenCalledTimes(1);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('does not mount any route on the host router when start() throws', async () => {
    fake.start.mockImplementation(async () => {
      throw new Error('start failed');
    });

    const routerUse = context.router.use as ReturnType<typeof vi.fn>;
    const moduleDef = createScheduleApiModule({ instance: fake.instance });

    await expect(moduleDef.register(context)).rejects.toThrow('start failed');
    expect(routerUse).not.toHaveBeenCalled();
    expect(fake.start).toHaveBeenCalledTimes(1);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('destroy() after a failed registration does not dispose a second time', async () => {
    fake.start.mockImplementation(async () => {
      throw new Error('start failed');
    });

    const moduleDef = createScheduleApiModule({ instance: fake.instance });

    await expect(moduleDef.register(context)).rejects.toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);

    moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('rolls back both mounts on the host router when the second router.use() throws', async () => {
    const preExisting = { name: '<pre-existing>' };
    const routerStub = {
      stack: [preExisting],
      use: vi
        .fn()
        .mockImplementationOnce(() => {
          routerStub.stack.push({ name: '/schedules layer' });
        })
        .mockImplementationOnce(() => {
          throw new Error('mount failed');
        }),
    } as unknown as Router;

    const mountContext = { ...context, router: routerStub } as ScheduleApiModuleContext;
    const moduleDef = createScheduleApiModule({ instance: fake.instance });

    await expect(moduleDef.register(mountContext)).rejects.toThrow('mount failed');
    expect(fake.start).toHaveBeenCalledTimes(1);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect((routerStub as unknown as { stack: unknown[] }).stack).toEqual([preExisting]);

    moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('rethrows the original registration error even if dispose also throws', async () => {
    fake.start.mockImplementation(async () => {
      throw new Error('start failed');
    });
    fake.dispose.mockImplementation(async () => {
      throw new Error('dispose failed');
    });

    const moduleDef = createScheduleApiModule({ instance: fake.instance });

    await expect(moduleDef.register(context)).rejects.toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });
});
