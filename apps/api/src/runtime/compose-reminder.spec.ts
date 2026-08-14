/**
 * Reminder API composition root spec.
 * 提醒 API 组合根测试。
 *
 * Verifies composeReminder():
 * - assembles reminder in the mandated plan §3.3 order
 *   (repository set → module-owned trigger cron runtime → module instance →
 *   schedule execution/projection sources → API module)
 * - passes the host closureChecker through unchanged
 * - wires the module-owned reminder trigger cron runtime (merge-base behavior)
 * - builds both schedule sources from the SAME repository set as the module
 * - returns an already-bound IApiModule-compatible handle
 * - mounts /reminders and starts the owned instance when registered
 *
 * 验证 composeReminder()：
 * - 按计划 §3.3 顺序装配提醒（仓储集合 → 模块自有触发 cron runtime → module
 *   instance → schedule execution/projection sources → API module）
 * - 原样透传宿主 closureChecker
 * - 接入模块自有提醒触发 cron runtime（merge-base 行为）
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
    createReminderPrismaRepositories: vi.fn(actual.createReminderPrismaRepositories),
    createReminderModule: vi.fn(actual.createReminderModule),
    createReminderTriggerCronRuntime: vi.fn(actual.createReminderTriggerCronRuntime),
    createReminderScheduleExecutionSource: vi.fn(actual.createReminderScheduleExecutionSource),
    createReminderScheduleProjectionSource: vi.fn(actual.createReminderScheduleProjectionSource),
  };
});

vi.mock('@memoflow/reminder/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@memoflow/reminder/api')>();
  return {
    ...actual,
    createReminderApiModule: vi.fn(actual.createReminderApiModule),
  };
});

import { composeReminder } from './compose-reminder';
import {
  createReminderModule,
  createReminderPrismaRepositories,
  createReminderTriggerCronRuntime,
  createReminderScheduleExecutionSource,
  createReminderScheduleProjectionSource,
} from '@memoflow/reminder';
import { createReminderApiModule } from '@memoflow/reminder/api';

const fakeDb = {} as unknown as PrismaClient;
const closureChecker = async (_identityId: string): Promise<boolean> => false;

describe('composeReminder assembly order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assembles in plan §3.3 order: repositories → cron runtime → module → schedule sources → api module', () => {
    composeReminder({ db: fakeDb, closureChecker });

    const reposOrder = createReminderPrismaRepositories.mock.invocationCallOrder[0];
    const cronOrder = createReminderTriggerCronRuntime.mock.invocationCallOrder[0];
    const moduleOrder = createReminderModule.mock.invocationCallOrder[0];
    const executionOrder = createReminderScheduleExecutionSource.mock.invocationCallOrder[0];
    const projectionOrder = createReminderScheduleProjectionSource.mock.invocationCallOrder[0];
    const apiModuleOrder = createReminderApiModule.mock.invocationCallOrder[0];

    expect(reposOrder).toBeLessThan(cronOrder);
    expect(cronOrder).toBeLessThan(moduleOrder);
    expect(moduleOrder).toBeLessThan(executionOrder);
    expect(executionOrder).toBeLessThan(projectionOrder);
    expect(projectionOrder).toBeLessThan(apiModuleOrder);
  });

  it('passes the fake db and host closureChecker through unchanged', () => {
    composeReminder({ db: fakeDb, closureChecker });

    expect(createReminderPrismaRepositories).toHaveBeenCalledWith(fakeDb);

    const repoSet = createReminderPrismaRepositories.mock.results[0].value;
    expect(createReminderTriggerCronRuntime).toHaveBeenCalledWith({
      reminderTemplateRepository: repoSet.reminderTemplateRepository,
      reminderGroupRepository: repoSet.reminderGroupRepository,
      reliablePort: repoSet.reliablePort,
      transactionRunner: repoSet.transactionRunner,
    });

    const moduleCall = createReminderModule.mock.calls[0][0];
    expect(moduleCall).toMatchObject({
      reminderTemplateRepository: repoSet.reminderTemplateRepository,
      reminderGroupRepository: repoSet.reminderGroupRepository,
      reminderResponseRepository: repoSet.reminderResponseRepository,
      userReminderPreferenceRepository: repoSet.userReminderPreferenceRepository,
      closureChecker,
      reliablePort: repoSet.reliablePort,
      snoozeRescheduler: repoSet.snoozeRescheduler,
      auditRepository: repoSet.auditRepository,
    });
    expect(moduleCall.runtimeContributions).toContain(
      createReminderTriggerCronRuntime.mock.results[0].value,
    );

    const instance = createReminderModule.mock.results[0].value;
    expect(createReminderApiModule).toHaveBeenCalledWith({ instance });
  });

  it('wires the module-owned trigger cron runtime (merge-base behavior restored)', () => {
    composeReminder({ db: fakeDb, closureChecker });

    const moduleCall = createReminderModule.mock.calls[0][0];
    const cronContribution = createReminderTriggerCronRuntime.mock.results[0].value;
    expect(moduleCall.runtimeContributions[0]).toBe(cronContribution);
  });

  it('builds both schedule sources from the SAME repository set as the module', () => {
    composeReminder({ db: fakeDb, closureChecker });

    const instance = createReminderModule.mock.results[0].value;
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

    const instance = createReminderModule.mock.results[0].value;
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
 * construction (no queries) and its runtime contributions (cron) start lazily,
 * so registering with a fake db succeeds and mounts /reminders.
 *
 * 真实工厂下：提醒 Prisma module 构造时只持有 db 引用（无查询），其运行时贡献
 * （cron）惰性启动，因此用 fake db 注册可成功并挂载 /reminders。
 */
describe('composeReminder structural registration', () => {
  let routerUse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    routerUse = vi.fn();
  });

  it('mounts /reminders on the router and starts the owned instance', async () => {
    const composed = composeReminder({ db: fakeDb, closureChecker });

    const instance = createReminderModule.mock.results[0].value;
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
