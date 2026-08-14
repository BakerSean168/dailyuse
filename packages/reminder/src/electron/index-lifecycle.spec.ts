/**
 * Reminder Electron IPC Lifecycle Spec
 * 提醒 Electron IPC 生命周期测试
 *
 * Verifies that createReminderElectronModule is a pure transport/lifecycle
 * adapter: it registers all reminder channels, starts the already-assembled
 * instance once, routes IPC calls through ReminderController to the same
 * instance api, removes all channels on destroy, disposes exactly once, and
 * cleans up on start failure. It also locks the per-handle state machine:
 * double register() throws, register-after-destroy throws, and a failed
 * registration reverses exactly the channels installed by that call.
 *
 * 验证 createReminderElectronModule 是纯传输/生命周期适配器：
 * 注册全部提醒通道、启动已装配实例一次、通过 ReminderController 把 IPC 调用
 * 路由到同一实例 api、destroy 时移除全部通道、恰好 dispose 一次，且 start
 * 失败时执行清理。同时固定每个 handle 的状态机：重复 register() 抛错、
 * destroy 后 register() 抛错、失败注册会逆向移除本次已安装的通道。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReminderChannels, type IElectronModuleContext } from '@memoflow/contracts/electron';
import { ok } from '@memoflow/contracts/result';
import type { ReminderModuleInstance } from '../server/infrastructure';

const mocks = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const handle = vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
    if (handlers.has(channel)) {
      throw new Error(`Attempted to register a second handler for '${channel}'`);
    }
    handlers.set(channel, handler);
  });
  const removeHandler = vi.fn((channel: string) => {
    handlers.delete(channel);
  });
  return {
    handlers,
    handle,
    removeHandler,
  };
});

vi.mock('electron', () => ({
  ipcMain: {
    handle: mocks.handle,
    removeHandler: mocks.removeHandler,
  },
}));

import { createReminderElectronModule } from './index';

function createFakeInstance() {
  const api = {
    listTemplates: vi.fn(() => ok([] as never)),
    getTemplate: vi.fn(() => ok(null as never)),
    createTemplate: vi.fn(() => ok(null as never)),
    updateTemplate: vi.fn(() => ok(null as never)),
    deleteTemplate: vi.fn(() => ok(null as never)),
    toggleTemplate: vi.fn(() => ok(null as never)),
    moveTemplate: vi.fn(() => ok(null as never)),
    listGroups: vi.fn(() => ok([] as never)),
    getGroup: vi.fn(() => ok(null as never)),
    createGroup: vi.fn(() => ok(null as never)),
    updateGroup: vi.fn(() => ok(null as never)),
    deleteGroup: vi.fn(() => ok(null as never)),
    toggleGroup: vi.fn(() => ok(null as never)),
    switchGroupControlMode: vi.fn(() => ok(null as never)),
    getPreferences: vi.fn(() => ok(null as never)),
    updatePreferences: vi.fn(() => ok(null as never)),
  };
  const start = vi.fn();
  const dispose = vi.fn();
  const instance: ReminderModuleInstance = {
    reminderTemplateRepository: {} as never,
    reminderGroupRepository: {} as never,
    reminderResponseRepository: {} as never,
    userReminderPreferenceRepository: {} as never,
    useCases: {} as never,
    api,
    start,
    dispose,
  } as ReminderModuleInstance;
  return { instance, api, start, dispose };
}

function createFakeContext(): IElectronModuleContext {
  return {
    db: {},
    auth: {
      requireRequestContext: vi.fn().mockResolvedValue({ identityId: 'identity-1' }),
    },
  } as unknown as IElectronModuleContext;
}

function registered(channel: string) {
  const handler = mocks.handlers.get(channel);
  expect(handler, `Expected ${channel} to be registered`).toBeDefined();
  return handler!;
}

describe('createReminderElectronModule lifecycle', () => {
  let fake: ReturnType<typeof createFakeInstance>;
  let context: IElectronModuleContext;
  let moduleDef: ReturnType<typeof createReminderElectronModule>;

  beforeEach(() => {
    fake = createFakeInstance();
    context = createFakeContext();
    moduleDef = createReminderElectronModule({ instance: fake.instance });
  });

  afterEach(() => {
    try {
      moduleDef.destroy?.();
    } catch {
      // destroy() may propagate a dispose error by design; don't leak it into unrelated tests.
    }
    vi.clearAllMocks();
    mocks.handlers.clear();
  });

  it('registers all reminder channels and starts the instance once', () => {
    moduleDef.register(context);

    for (const channel of Object.values(ReminderChannels)) {
      expect(mocks.handlers.has(channel), `Expected ${channel} to be registered`).toBe(true);
    }
    expect(mocks.handlers.size).toBe(Object.values(ReminderChannels).length);
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('throws on a second register() call (single registration per handle)', () => {
    moduleDef.register(context);

    expect(() => moduleDef.register(context)).toThrow(/only register once/);
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('throws on register() after destroy()', () => {
    moduleDef.register(context);
    moduleDef.destroy?.();

    expect(() => moduleDef.register(context)).toThrow(/only register once/);
  });

  it('routes IPC calls through the controller to the same instance api', async () => {
    fake.api.listTemplates.mockResolvedValue(ok([] as never));
    moduleDef.register(context);

    const listResult = await registered(ReminderChannels.TEMPLATE_LIST)(undefined, undefined);
    expect(listResult).toMatchObject({ ok: true });
    expect(fake.api.listTemplates).toHaveBeenCalledTimes(1);
  });

  it('destroy removes all channels and disposes exactly once (second call no-ops)', () => {
    moduleDef.register(context);

    moduleDef.destroy?.();
    for (const channel of Object.values(ReminderChannels)) {
      expect(mocks.handlers.has(channel)).toBe(false);
    }
    expect(mocks.removeHandler).toHaveBeenCalledTimes(Object.values(ReminderChannels).length);
    expect(fake.dispose).toHaveBeenCalledTimes(1);

    moduleDef.destroy?.();
    moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('disposes, removes all channels, and rethrows when start() throws, leaving a handle that cannot be re-registered', () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });

    expect(() => moduleDef.register(context)).toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.handlers.size).toBe(0);

    expect(() => moduleDef.register(context)).toThrow(/only register once/);
    expect(fake.start).toHaveBeenCalledTimes(1);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('removes the channels installed before ipcMain.handle() throws mid-registration', () => {
    // The first two handle() calls are the channels installed before the third
    // throws; assert reverse removal of exactly those.
    const registeredFirst: string[] = [];
    mocks.handle
      .mockImplementationOnce((channel: string, handler: (...args: unknown[]) => unknown) => {
        registeredFirst.push(channel);
        mocks.handlers.set(channel, handler);
      })
      .mockImplementationOnce((channel: string, handler: (...args: unknown[]) => unknown) => {
        registeredFirst.push(channel);
        mocks.handlers.set(channel, handler);
      })
      .mockImplementationOnce((channel: string) => {
        throw new Error(`Attempted to register a second handler for '${channel}'`);
      });

    expect(() => moduleDef.register(context)).toThrow('second handler');

    expect(mocks.handlers.size).toBe(0);
    expect(mocks.removeHandler.mock.calls.map(([channel]) => channel)).toEqual([
      registeredFirst[1],
      registeredFirst[0],
    ]);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(fake.start).not.toHaveBeenCalled();

    expect(() => moduleDef.register(context)).toThrow(/only register once/);
  });

  it('rethrows the original registration error even if dispose also throws', () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });
    fake.dispose.mockImplementation(() => {
      throw new Error('dispose failed');
    });

    expect(() => moduleDef.register(context)).toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.handlers.size).toBe(0);
  });

  it('destroy() after a failed registration neither disposes again nor re-removes channels', () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });

    expect(() => moduleDef.register(context)).toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.handlers.size).toBe(0);
    const removeHandlerCallsAfterFailedRegister = mocks.removeHandler.mock.calls.length;

    moduleDef.destroy?.();

    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.removeHandler.mock.calls.length).toBe(removeHandlerCallsAfterFailedRegister);
  });

  it('register works with a context that has no db property (no db read for assembly)', () => {
    const contextWithoutDb = { ...context } as IElectronModuleContext;
    delete (contextWithoutDb as Record<string, unknown>).db;

    expect(() => moduleDef.register(contextWithoutDb)).not.toThrow();
    expect(fake.start).toHaveBeenCalledTimes(1);
  });
});
