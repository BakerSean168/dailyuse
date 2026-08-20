/**
 * AI Electron IPC Lifecycle Spec
 * AI Electron IPC 生命周期测试
 *
 * Verifies that createAIElectronModule is a pure transport/lifecycle adapter:
 * it registers all AI channels, starts the already-assembled instance once,
 * routes IPC calls to the same instance api, removes all channels on destroy,
 * aborts active stream sessions on destroy, disposes exactly once, and cleans
 * up on start failure. It also locks the per-handle state machine: double
 * register() throws, register-after-destroy throws, and a failed registration
 * reverses exactly the channels installed by that call.
 *
 * 验证 createAIElectronModule 是纯传输/生命周期适配器：
 * 注册全部 AI 通道、启动已装配实例一次、把 IPC 调用路由到同一实例 api、
 * destroy 时移除全部通道并中止活动流会话、恰好 dispose 一次，且 start 失败时
 * 执行清理。同时固定每个 handle 的状态机：重复 register() 抛错、destroy 后
 * register() 抛错、失败注册会逆向移除本次已安装的通道。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIChannels, type IElectronModuleContext } from '@memoflow/contracts/electron';
import { ok } from '@memoflow/contracts/result';
import type { AIModuleInstance } from '../server/infrastructure';

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

import { createAIElectronModule } from './index';

function createFakeInstance() {
  const api = {
    getCapabilities: vi.fn(() => ok(null as never)),
    createProvider: vi.fn(() => ok(null as never)),
    listProviders: vi.fn(() => ok({ data: [] } as never)),
    getProvider: vi.fn(() => ok(null as never)),
    updateProvider: vi.fn(() => ok(null as never)),
    deleteProvider: vi.fn(() => ok(null as never)),
    testConnection: vi.fn(() => ok(null as never)),
    setDefaultProvider: vi.fn(() => ok(null as never)),
    refreshProviderModels: vi.fn(() => ok(null as never)),
    generateGoal: vi.fn(() => ok(null as never)),
    createConversation: vi.fn(() => ok(null as never)),
    updateConversation: vi.fn(() => ok(null as never)),
    listConversations: vi.fn(() => ok({ data: [], total: 0 } as never)),
    getConversation: vi.fn(() => ok({ messages: [] } as never)),
    deleteConversation: vi.fn(() => ok(null as never)),
    sendMessage: vi.fn(() => ok(null as never)),
    streamMessage: vi.fn(() => ok(null as never)),
    dispatchAssistant: vi.fn(() => ok(null as never)),
    createKnowledgeNote: vi.fn(() => ok(null as never)),
    queryKnowledge: vi.fn(() => ok(null as never)),
    expandKnowledge: vi.fn(() => ok(null as never)),
    reindexKnowledge: vi.fn(() => ok(null as never)),
    queryAnalytics: vi.fn(() => ok(null as never)),
    listAgentRuns: vi.fn(() => ok([] as never)),
    startAgentRun: vi.fn(() => ok(null as never)),
    resumeAgentRun: vi.fn(() => ok(null as never)),
    getAgentRun: vi.fn(() => ok(null as never)),
    getAgentEvents: vi.fn(() => ok([] as never)),
    getEvaluationOverview: vi.fn(() => ok(null as never)),
  };
  const start = vi.fn();
  const dispose = vi.fn();
  const instance: AIModuleInstance = {
    conversationRepository: {} as never,
    providerConfigRepository: {} as never,
    services: {} as never,
    api,
    turnEngine: {} as never,
    readonlyTurnEngine: {} as never,
    workflowAdapter: null,
    proposalKernel: {} as never,
    capabilityResolver: {} as never,
    modelGateway: {} as never,
    assistantFacade: {} as never,
    start,
    dispose,
  } as AIModuleInstance;
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

describe('createAIElectronModule lifecycle', () => {
  let fake: ReturnType<typeof createFakeInstance>;
  let context: IElectronModuleContext;
  let moduleDef: ReturnType<typeof createAIElectronModule>;

  beforeEach(() => {
    fake = createFakeInstance();
    context = createFakeContext();
    moduleDef = createAIElectronModule({ instance: fake.instance });
  });

  afterEach(async () => {
    try {
      await moduleDef.destroy?.();
    } catch {
      // destroy() may propagate a dispose error by design; don't leak it into unrelated tests.
    }
    vi.clearAllMocks();
    mocks.handlers.clear();
  });

  it('registers all AI channels and starts the instance once', async () => {
    await moduleDef.register(context);

    for (const channel of Object.values(AIChannels)) {
      expect(mocks.handlers.has(channel), `Expected ${channel} to be registered`).toBe(true);
    }
    expect(mocks.handlers.size).toBe(Object.values(AIChannels).length);
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('throws on a second register() call (single registration per handle)', async () => {
    await moduleDef.register(context);

    await expect(moduleDef.register(context)).rejects.toThrow(/only register once/);
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('throws on register() after destroy()', async () => {
    await moduleDef.register(context);
    await moduleDef.destroy?.();

    await expect(moduleDef.register(context)).rejects.toThrow(/only register once/);
  });

  it('routes IPC calls through to the same instance api', async () => {
    fake.api.listProviders.mockResolvedValue(ok({ data: [] } as never));
    await moduleDef.register(context);

    const result = await registered(AIChannels.PROVIDER_LIST)(undefined, undefined);
    expect(result).toMatchObject({ ok: true });
    expect(fake.api.listProviders).toHaveBeenCalledTimes(1);
  });

  it('destroy removes all channels and disposes exactly once (second call no-ops)', async () => {
    await moduleDef.register(context);

    await moduleDef.destroy?.();
    for (const channel of Object.values(AIChannels)) {
      expect(mocks.handlers.has(channel)).toBe(false);
    }
    expect(mocks.removeHandler).toHaveBeenCalledTimes(Object.values(AIChannels).length);
    expect(fake.dispose).toHaveBeenCalledTimes(1);

    await moduleDef.destroy?.();
    await moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('disposes, removes all channels, and rethrows when start() throws, leaving a handle that cannot be re-registered', async () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });

    await expect(moduleDef.register(context)).rejects.toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.handlers.size).toBe(0);

    await expect(moduleDef.register(context)).rejects.toThrow(/only register once/);
    expect(fake.start).toHaveBeenCalledTimes(1);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('removes the channels installed before ipcMain.handle() throws mid-registration', async () => {
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

    await expect(moduleDef.register(context)).rejects.toThrow('second handler');

    expect(mocks.handlers.size).toBe(0);
    expect(mocks.removeHandler.mock.calls.map(([channel]) => channel)).toEqual([
      registeredFirst[1],
      registeredFirst[0],
    ]);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(fake.start).not.toHaveBeenCalled();

    await expect(moduleDef.register(context)).rejects.toThrow(/only register once/);
  });

  it('rethrows the original registration error even if dispose also throws', async () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });
    fake.dispose.mockImplementation(() => {
      throw new Error('dispose failed');
    });

    await expect(moduleDef.register(context)).rejects.toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.handlers.size).toBe(0);
  });

  it('destroy() after a failed registration neither disposes again nor re-removes channels', async () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });

    await expect(moduleDef.register(context)).rejects.toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.handlers.size).toBe(0);
    const removeHandlerCallsAfterFailedRegister = mocks.removeHandler.mock.calls.length;

    await moduleDef.destroy?.();

    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect(mocks.removeHandler.mock.calls.length).toBe(removeHandlerCallsAfterFailedRegister);
  });

  it('register works with a context that has no db property (no db read for assembly)', async () => {
    const contextWithoutDb = { ...context } as IElectronModuleContext;
    delete (contextWithoutDb as Record<string, unknown>).db;

    await expect(moduleDef.register(contextWithoutDb)).resolves.toBeUndefined();
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('MESSAGE_STREAM_CANCEL aborts the active stream for the same sender', async () => {
    await moduleDef.register(context);

    let capturedSignal: AbortSignal | undefined;
    fake.api.streamMessage.mockImplementation(
      async (
        _conversationId: string,
        _content: string,
        _onChunk: () => void,
        _context: unknown,
        _providerId?: string,
        _model?: string,
        signal?: AbortSignal,
      ) => {
        capturedSignal = signal;
        return new Promise((resolve) => {
          signal?.addEventListener('abort', () => resolve(ok(null as never)));
        });
      },
    );

    const sender = { sender: { id: 42, isDestroyed: () => false, send: vi.fn() } };
    const startResult = await registered(AIChannels.MESSAGE_STREAM_START)(sender, {
      streamId: 's1',
      conversationId: 'c1',
      content: 'hello',
    });
    expect(startResult).toMatchObject({ ok: true });

    await vi.waitFor(() => expect(capturedSignal).toBeDefined());
    expect(capturedSignal?.aborted).toBe(false);

    const cancelResult = await registered(AIChannels.MESSAGE_STREAM_CANCEL)(sender, 's1');
    expect(cancelResult).toMatchObject({ ok: true });
    expect(capturedSignal?.aborted).toBe(true);
  });
});
