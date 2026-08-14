/**
 * Reminder API composition root spec.
 * 提醒 API 组合根测试。
 *
 * Verifies composeReminder():
 * - assembles reminder in the mandated plan §3.3 order
 *   (module instance → schedule execution/projection sources → API module)
 * - passes the host closureChecker through unchanged
 * - builds both schedule sources from the SAME repository set as the module
 * - returns an already-bound IApiModule-compatible handle
 * - mounts /reminders and starts the owned instance when registered
 *
 * 验证 composeReminder()：
 * - 按计划 §3.3 顺序装配提醒（module instance → schedule execution/projection
 *   sources → API module）
 * - 原样透传宿主 closureChecker
 * - 从与模块相同的仓储集合构建两个 schedule sources
 * - 返回已绑定 instance 的、兼容 IApiModule 的 handle
 * - register() 挂载 /reminders 并启动所属实例
 *
 * The ingredient factories are wrapped in vi.fn() so the spec can assert assembly
 * order, while delegating to the real implementations so the structural
 * registration test runs against genuine factories with a fake db.
 *
 * ingredient 工厂被包成 vi.fn() 以便断言装配顺序，同时委托真实实现，
 * 使结构注册测试用真实工厂 + fake db 运行。
 */

import type { Express, Router } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@memoflow/database';
import type { ReminderApiModuleContext } from '@memoflow/reminder/api';

vi.mock('@memoflow/reminder', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/reminder')>();
  return {
    ...actual,
    createReminderPrismaModule: vi.fn(actual.createReminderPrismaModule),
  };
});

vi.mock('@memoflow/reminder/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/reminder/api')>();
  return {
    ...actual,
    createReminderApiModule: vi.fn(actual.createReminderApiModule),
  };
});

vi.mock('@memoflow/reminder/schedule-execution', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/reminder/schedule-execution')>();
  return {
    ...actual,
    createReminderScheduleExecutionSource: vi.fn(actual.createReminderScheduleExecutionSource),
  };
});

vi.mock('@memoflow/reminder/schedule-projection', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/reminder/schedule-projection')>();
  return {
    ...actual,
    createReminderScheduleProjectionSource: vi.fn(actual.createReminderScheduleProjectionSource),
  };
});

import { composeReminder } from './compose-reminder';
import { createReminderPrismaModule } from '@memoflow/reminder';
import { createReminderApiModule } from '@memoflow/reminder/api';
import { createReminderScheduleExecutionSource } from '@memoflow/reminder/schedule-execution';
import { createReminderScheduleProjectionSource } from '@memoflow/reminder/schedule-projection';

const fakeDb = {} as unknown as PrismaClient;
const closureChecker = async (_identityId: string): Promise<boolean> => false;

describe('composeReminder assembly order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assembles in plan §3.3 order: module → schedule sources → api module', () => {
    composeReminder({ db: fakeDb, closureChecker });

    const moduleOrder = createReminderPrismaModule.mock.invocationCallOrder[0];
    const executionOrder = createReminderScheduleExecutionSource.mock.invocationCallOrder[0];
    const projectionOrder = createReminderScheduleProjectionSource.mock.invocationCallOrder[0];
    const apiModuleOrder = createReminderApiModule.mock.invocationCallOrder[0];

    expect(moduleOrder).toBeLessThan(executionOrder);
    expect(executionOrder).toBeLessThan(projectionOrder);
    expect(projectionOrder).toBeLessThan(apiModuleOrder);
  });

  it('passes the fake db and host closureChecker through unchanged', () => {
    composeReminder({ db: fakeDb, closureChecker });

    expect(createReminderPrismaModule).toHaveBeenCalledWith(fakeDb, {
      closureChecker,
      runtimeContributions: undefined,
    });

    const instance = createReminderPrismaModule.mock.results[0].value;
    expect(createReminderApiModule).toHaveBeenCalledWith({ instance });
  });

  it('builds both schedule sources from the SAME repository set as the module', () => {
    composeReminder({ db: fakeDb, closureChecker });

    const instance = createReminderPrismaModule.mock.results[0].value;
    const templateRepository = instance.reminderTemplateRepository;

    expect(createReminderScheduleExecutionSource).toHaveBeenCalledWith({
      reminderTemplateRepository: templateRepository,
    });
    expect(createReminderScheduleProjectionSource).toHaveBeenCalledWith({
      reminderTemplateRepository: templateRepository,
    });
  });

  it('returns the module handle, repository view and both schedule sources', () => {
    const composed = composeReminder({ db: fakeDb, closureChecker });

    expect(composed.module).toMatchObject({ name: 'Reminder' });
    expect(typeof composed.module.register).toBe('function');
    expect(typeof composed.module.destroy).toBe('function');

    const instance = createReminderPrismaModule.mock.results[0].value;
    expect(composed.repositories.reminderTemplateRepository).toBe(
      instance.reminderTemplateRepository,
    );
    expect(composed.scheduleExecutionSource).toBe(
      createReminderScheduleExecutionSource.mock.results[0].value,
    );
    expect(composed.scheduleProjectionSource).toBe(
      createReminderScheduleProjectionSource.mock.results[0].value,
    );
  });
});

/**
 * Structural registration test using real factories and a fake db.
 * 用真实工厂 + fake db 的结构注册测试。
 *
 * Real factories: the reminder Prisma module only holds the db reference at
 * construction (no queries) and has no runtime contributions when none are
 * supplied, so registering with a fake db succeeds and mounts /reminders.
 *
 * 真实工厂下：提醒 Prisma module 构造时只持有 db 引用（无查询），且在未提供运行时
 * 贡献时没有运行时，因此用 fake db 注册可成功并挂载 /reminders。
 */
describe('composeReminder structural registration', () => {
  let routerUse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    routerUse = vi.fn();
  });

  it('mounts /reminders on the router and starts the owned instance', async () => {
    const composed = composeReminder({ db: fakeDb, closureChecker });

    const instance = createReminderPrismaModule.mock.results[0].value;
    const startSpy = vi.spyOn(instance, 'start');
    const disposeSpy = vi.spyOn(instance, 'dispose');

    const context: ReminderApiModuleContext = {
      app: {} as Express,
      router: { use: routerUse, stack: [] } as unknown as Router,
      middleware: {
        auth: vi.fn(),
        requireRole: vi.fn(() => vi.fn()),
      },
      openApiRegistry: undefined,
    };

    await expect(composed.module.register(context)).resolves.toBeUndefined();
    expect(routerUse).toHaveBeenCalledWith('/reminders', expect.anything());

    expect(startSpy).toHaveBeenCalledTimes(1);

    await composed.module.destroy?.();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});
