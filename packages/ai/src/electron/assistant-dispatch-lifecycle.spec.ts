/**
 * Assistant Dispatch Electron main lifecycle spec (plan Step B §5.2, residual 353).
 *
 * Locks the Desktop IPC dispatch stream on the main side:
 * - START validates with the shared AssistantClientCommandSchema and injects
 *   identity from the authenticated context (a renderer-supplied identityId is
 *   rejected);
 * - the session is bound to the sender webContentsId, so only that sender may
 *   cancel;
 * - success/error/catch/abort paths delete the active session exactly once and
 *   never emit a second DONE/ERROR frame;
 * - a destroyed sender never receives a push; module dispose aborts active
 *   sessions.
 *
 * Assistant Dispatch Electron main 生命周期测试（计划 Step B §5.2，residual 353）。
 *
 * 锁定 Desktop IPC dispatch 流的 main 侧行为：START 使用共享
 * AssistantClientCommandSchema 校验并从认证上下文注入 identity（renderer 夹带的
 * identityId 被拒绝）；session 绑定 sender webContentsId，仅该 sender 可取消；
 * success/error/catch/abort 各分支恰好删除一次活动 session，且绝不双发 DONE/ERROR
 * 帧；sender 被销毁后不再 push；module dispose 中止全部活动 session。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AIChannels,
  AIStreamChannels,
  type IElectronModuleContext,
} from '@memoflow/contracts/electron';
import { fail, ok } from '@memoflow/contracts/result';
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
  const dispatchRuntimeMessage = vi.fn(async function* () {});
  const cancelRuntimeRun = vi.fn(() => true);
  const listRuntimeMessages = vi.fn(async () => ({
    conversationId: 'conv-1',
    messages: [
      {
        id: 'mastra-message-1',
        conversationId: 'conv-1',
        role: 'assistant' as const,
        content: 'persisted reply',
        createdAt: 1,
      },
    ],
  }));
  const deleteRuntimeConversation = vi.fn(async () => true);
  const mastraRuntime = {
    dispatchMessage: dispatchRuntimeMessage,
    cancelRun: cancelRuntimeRun,
    listMessages: listRuntimeMessages,
    deleteConversation: deleteRuntimeConversation,
  };
  const workflowRun = {
    runId: 'workflow-1',
    kind: 'goal.create' as const,
    conversationId: 'conv-1',
    status: 'suspended' as const,
    suspension: {
      type: 'clarification_required' as const,
      questions: ['What is the target date?'],
    },
    createdAt: 1,
    updatedAt: 2,
  };
  const workflowStart = vi.fn(async () => workflowRun);
  const workflowResume = vi.fn(async () => workflowRun);
  const workflowGet = vi.fn(async () => workflowRun);
  const workflowList = vi.fn(async () => [workflowRun]);
  const workflowCancel = vi.fn(async () => workflowRun);
  const workflowRuntime = {
    start: workflowStart,
    resume: workflowResume,
    get: workflowGet,
    list: workflowList,
    cancel: workflowCancel,
  };
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
    mastraRuntime: mastraRuntime as never,
    workflowRuntime: workflowRuntime as never,
    start,
    dispose,
  } as AIModuleInstance;
  return {
    instance,
    api,
    start,
    dispose,
    mastraRuntime,
    dispatchRuntimeMessage,
    cancelRuntimeRun,
    listRuntimeMessages,
    deleteRuntimeConversation,
    workflowRun,
    workflowRuntime,
    workflowStart,
    workflowResume,
    workflowGet,
    workflowList,
    workflowCancel,
  };
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

function createSender(id: number) {
  return {
    sender: {
      id,
      isDestroyed: vi.fn(() => false),
      send: vi.fn(),
    },
  };
}

const dispatchCommand = {
  type: 'message',
  conversationId: 'conv-1',
  content: 'hello',
  surface: 'desktop',
};

describe('AIElectron assistant dispatch lifecycle', () => {
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

  it('streams canonical Mastra runtime events and injects authenticated identity', async () => {
    const runtimeEvent = {
      eventId: 'run-vnext-1:1',
      runId: 'run-vnext-1',
      conversationId: 'conv-1',
      sequence: 1,
      createdAt: 1,
      type: 'assistant.run.started' as const,
      data: {},
    };
    fake.dispatchRuntimeMessage.mockImplementation(async function* (input: {
      identityId: string;
      conversationId: string;
      content: string;
    }) {
      expect(input).toMatchObject({
        identityId: 'identity-1',
        conversationId: 'conv-1',
        content: 'hello',
      });
      yield runtimeEvent;
    });
    await moduleDef.register(context);
    const sender = createSender(42);

    const result = await registered(AIChannels.RUNTIME_ASSISTANT_START)(sender, {
      streamId: 'runtime-stream-1',
      command: dispatchCommand,
    });

    expect(result).toMatchObject({ ok: true });
    await vi.waitFor(() =>
      expect(sender.sender.send).toHaveBeenCalledWith(AIStreamChannels.RUNTIME_ASSISTANT_EVENT, {
        streamId: 'runtime-stream-1',
        event: runtimeEvent,
      }),
    );
  });

  it('rejects renderer identity injection before Mastra runtime dispatch', async () => {
    await moduleDef.register(context);
    const sender = createSender(42);

    const result = await registered(AIChannels.RUNTIME_ASSISTANT_START)(sender, {
      streamId: 'runtime-stream-identity',
      command: { ...dispatchCommand, identityId: 'attacker-controlled' },
    });

    expect(result).toMatchObject({ ok: false });
    expect(fake.dispatchRuntimeMessage).not.toHaveBeenCalled();
  });

  it('reads authoritative Mastra history with authenticated identity and rejects renderer identity injection', async () => {
    await moduleDef.register(context);

    const result = await registered(AIChannels.RUNTIME_ASSISTANT_HISTORY)(undefined, {
      conversationId: 'conv-1',
    });
    expect(result).toMatchObject({
      ok: true,
      data: { conversationId: 'conv-1' },
    });
    expect(fake.listRuntimeMessages).toHaveBeenCalledWith({
      identityId: 'identity-1',
      conversationId: 'conv-1',
    });

    const injected = await registered(AIChannels.RUNTIME_ASSISTANT_HISTORY)(undefined, {
      conversationId: 'conv-1',
      identityId: 'attacker-controlled',
    });
    expect(injected).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
    expect(fake.listRuntimeMessages).toHaveBeenCalledTimes(1);
  });

  it('deletes authoritative Mastra history with authenticated identity and rejects renderer identity injection', async () => {
    await moduleDef.register(context);

    const result = await registered(AIChannels.RUNTIME_ASSISTANT_DELETE)(undefined, {
      conversationId: 'conv-1',
    });
    expect(result).toMatchObject({ ok: true, data: { deleted: true } });
    expect(fake.deleteRuntimeConversation).toHaveBeenCalledWith({
      identityId: 'identity-1',
      conversationId: 'conv-1',
    });

    const injected = await registered(AIChannels.RUNTIME_ASSISTANT_DELETE)(undefined, {
      conversationId: 'conv-1',
      identityId: 'attacker-controlled',
    });
    expect(injected).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
    expect(fake.deleteRuntimeConversation).toHaveBeenCalledTimes(1);
  });

  it('cancels a Mastra run only through authenticated identity plus runId', async () => {
    await moduleDef.register(context);

    const result = await registered(AIChannels.RUNTIME_ASSISTANT_CANCEL)(undefined, {
      type: 'cancel_run',
      runId: 'run-vnext-1',
    });

    expect(result).toMatchObject({ ok: true, data: { cancelled: true } });
    expect(fake.cancelRuntimeRun).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'run-vnext-1',
    });
  });

  it('exposes canonical workflow request channels with authenticated identity injection', async () => {
    await moduleDef.register(context);

    const startResult = await registered(AIChannels.RUNTIME_WORKFLOW_START)(undefined, {
      kind: 'goal.create',
      conversationId: 'conv-1',
      input: { idea: 'Run a 5K' },
    });
    expect(startResult).toMatchObject({ ok: true, data: fake.workflowRun });
    expect(fake.workflowStart).toHaveBeenCalledWith({
      context: { identityId: 'identity-1' },
      request: {
        kind: 'goal.create',
        conversationId: 'conv-1',
        input: { idea: 'Run a 5K' },
      },
    });

    await registered(AIChannels.RUNTIME_WORKFLOW_RESUME)(undefined, {
      runId: 'workflow-1',
      command: { type: 'approve' },
    });
    expect(fake.workflowResume).toHaveBeenCalledWith({
      context: { identityId: 'identity-1' },
      request: { runId: 'workflow-1', command: { type: 'approve' } },
    });

    await registered(AIChannels.RUNTIME_WORKFLOW_GET)(undefined, { runId: 'workflow-1' });
    expect(fake.workflowGet).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'workflow-1',
    });

    await registered(AIChannels.RUNTIME_WORKFLOW_LIST)(undefined, { conversationId: 'conv-1' });
    expect(fake.workflowList).toHaveBeenCalledWith({
      identityId: 'identity-1',
      conversationId: 'conv-1',
    });

    await registered(AIChannels.RUNTIME_WORKFLOW_CANCEL)(undefined, { runId: 'workflow-1' });
    expect(fake.workflowCancel).toHaveBeenCalledWith({
      identityId: 'identity-1',
      runId: 'workflow-1',
    });
  });

  it('rejects workflow identity injection before the runtime port is called', async () => {
    await moduleDef.register(context);

    const result = await registered(AIChannels.RUNTIME_WORKFLOW_START)(undefined, {
      kind: 'goal.create',
      conversationId: 'conv-1',
      input: {},
      identityId: 'attacker-controlled',
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
    expect(fake.workflowStart).not.toHaveBeenCalled();
  });

  it('fails closed on workflow channels when no workflow runtime is composed', async () => {
    moduleDef = createAIElectronModule({
      instance: { ...fake.instance, workflowRuntime: null } as AIModuleInstance,
    });
    await moduleDef.register(context);

    const result = await registered(AIChannels.RUNTIME_WORKFLOW_START)(undefined, {
      kind: 'goal.create',
      conversationId: 'conv-1',
      input: {},
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'SERVICE_UNAVAILABLE' } });
  });

  it('injects authenticated identity, streams events and emits exactly one DONE frame', async () => {
    fake.api.dispatchAssistant.mockImplementation(
      async (command: unknown, handlers: { onEvent?: (event: unknown) => void }) => {
        expect(command).toMatchObject({
          ...dispatchCommand,
          identityId: 'identity-1',
        });
        handlers.onEvent?.({
          type: 'run.started',
          runId: 'run-1',
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
        });
        return ok({ eventCount: 1 });
      },
    );
    moduleDef.register(context);
    const sender = createSender(42);

    const startResult = await registered(AIChannels.ASSISTANT_DISPATCH_START)(sender, {
      streamId: 's1',
      command: dispatchCommand,
    });
    expect(startResult).toMatchObject({ ok: true });

    await vi.waitFor(() => {
      expect(sender.sender.send).toHaveBeenCalledWith(AIStreamChannels.ASSISTANT_DISPATCH_EVENT, {
        streamId: 's1',
        event: {
          type: 'run.started',
          runId: 'run-1',
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
        },
      });
      expect(sender.sender.send).toHaveBeenCalledWith(AIStreamChannels.ASSISTANT_DISPATCH_DONE, {
        streamId: 's1',
        result: { eventCount: 1 },
      });
    });

    const sentChannels = sender.sender.send.mock.calls.map(([channel]) => channel);
    expect(
      sentChannels.filter((c: string) => c === AIStreamChannels.ASSISTANT_DISPATCH_DONE),
    ).toHaveLength(1);
    expect(sentChannels).not.toContain(AIStreamChannels.ASSISTANT_DISPATCH_ERROR);
  });

  it('rejects a renderer-supplied identityId with VALIDATION_ERROR before dispatch', async () => {
    moduleDef.register(context);
    const sender = createSender(42);

    const result = await registered(AIChannels.ASSISTANT_DISPATCH_START)(sender, {
      streamId: 's1',
      command: { ...dispatchCommand, identityId: 'attacker' },
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
    expect(fake.api.dispatchAssistant).not.toHaveBeenCalled();
  });

  it('rejects an invalid command shape with VALIDATION_ERROR before dispatch', async () => {
    moduleDef.register(context);
    const sender = createSender(42);

    const result = await registered(AIChannels.ASSISTANT_DISPATCH_START)(sender, {
      streamId: 's1',
      command: { type: 'message', content: '' },
    });

    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION_ERROR' } });
    expect(fake.api.dispatchAssistant).not.toHaveBeenCalled();
  });

  it('emits exactly one ERROR frame and no DONE when dispatch returns a Result error', async () => {
    fake.api.dispatchAssistant.mockResolvedValue(
      fail({ code: 'NOT_FOUND', message: 'conversation missing' }),
    );
    moduleDef.register(context);
    const sender = createSender(42);

    await registered(AIChannels.ASSISTANT_DISPATCH_START)(sender, {
      streamId: 's1',
      command: dispatchCommand,
    });

    await vi.waitFor(() => {
      expect(sender.sender.send).toHaveBeenCalledWith(AIStreamChannels.ASSISTANT_DISPATCH_ERROR, {
        streamId: 's1',
        code: 'NOT_FOUND',
        message: 'conversation missing',
      });
    });
    const sentChannels = sender.sender.send.mock.calls.map(([channel]) => channel);
    expect(sentChannels).not.toContain(AIStreamChannels.ASSISTANT_DISPATCH_DONE);
  });

  it('emits exactly one ERROR frame when dispatchAssistant throws', async () => {
    fake.api.dispatchAssistant.mockRejectedValue(new Error('boom'));
    moduleDef.register(context);
    const sender = createSender(42);

    await registered(AIChannels.ASSISTANT_DISPATCH_START)(sender, {
      streamId: 's1',
      command: dispatchCommand,
    });

    await vi.waitFor(() => {
      expect(sender.sender.send).toHaveBeenCalledWith(AIStreamChannels.ASSISTANT_DISPATCH_ERROR, {
        streamId: 's1',
        code: 'INTERNAL_ERROR',
        message: 'boom',
      });
    });
    const sentChannels = sender.sender.send.mock.calls.map(([channel]) => channel);
    expect(
      sentChannels.filter((c: string) => c === AIStreamChannels.ASSISTANT_DISPATCH_ERROR),
    ).toHaveLength(1);
    expect(sentChannels).not.toContain(AIStreamChannels.ASSISTANT_DISPATCH_DONE);
  });

  it('allows only the owning sender to cancel an active dispatch session', async () => {
    let capturedSignal: AbortSignal | undefined;
    fake.api.dispatchAssistant.mockImplementation(
      async (_command: unknown, _handlers: unknown, signal?: AbortSignal) => {
        capturedSignal = signal;
        return new Promise((resolve) => {
          signal?.addEventListener('abort', () => resolve(ok({ eventCount: 0 } as never)));
        });
      },
    );
    moduleDef.register(context);
    const owner = createSender(42);
    const intruder = createSender(99);

    await registered(AIChannels.ASSISTANT_DISPATCH_START)(owner, {
      streamId: 's1',
      command: dispatchCommand,
    });
    await vi.waitFor(() => expect(capturedSignal).toBeDefined());

    // A different sender's cancel must be a no-op for ownership.
    await registered(AIChannels.ASSISTANT_DISPATCH_CANCEL)(intruder, 's1');
    expect(capturedSignal?.aborted).toBe(false);

    await registered(AIChannels.ASSISTANT_DISPATCH_CANCEL)(owner, 's1');
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('does not push to a destroyed sender', async () => {
    fake.api.dispatchAssistant.mockImplementation(
      async (_command: unknown, handlers: { onEvent?: (event: unknown) => void }) => {
        handlers.onEvent?.({
          type: 'run.started',
          runId: 'run-1',
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
        });
        return ok({ eventCount: 1 });
      },
    );
    moduleDef.register(context);
    const sender = createSender(42);
    sender.sender.isDestroyed.mockReturnValue(true);

    await registered(AIChannels.ASSISTANT_DISPATCH_START)(sender, {
      streamId: 's1',
      command: dispatchCommand,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sender.sender.send).not.toHaveBeenCalled();
  });

  it('never emits a terminal frame after the sender aborts (no fake DONE)', async () => {
    let capturedSignal: AbortSignal | undefined;
    fake.api.dispatchAssistant.mockImplementation(
      async (_command: unknown, _handlers: unknown, signal?: AbortSignal) => {
        capturedSignal = signal;
        return new Promise((resolve) => {
          signal?.addEventListener('abort', () => resolve(ok({ eventCount: 1 } as never)));
        });
      },
    );
    moduleDef.register(context);
    const sender = createSender(42);

    await registered(AIChannels.ASSISTANT_DISPATCH_START)(sender, {
      streamId: 's1',
      command: dispatchCommand,
    });
    await vi.waitFor(() => expect(capturedSignal).toBeDefined());

    await registered(AIChannels.ASSISTANT_DISPATCH_CANCEL)(sender, 's1');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const sentChannels = sender.sender.send.mock.calls.map(([channel]) => channel);
    expect(sentChannels).not.toContain(AIStreamChannels.ASSISTANT_DISPATCH_DONE);
    expect(sentChannels).not.toContain(AIStreamChannels.ASSISTANT_DISPATCH_ERROR);
  });

  it('module dispose aborts active dispatch sessions', async () => {
    let capturedSignal: AbortSignal | undefined;
    fake.api.dispatchAssistant.mockImplementation(
      async (_command: unknown, _handlers: unknown, signal?: AbortSignal) => {
        capturedSignal = signal;
        return new Promise(() => {
          signal?.addEventListener('abort', () => undefined);
        });
      },
    );
    moduleDef.register(context);
    const sender = createSender(42);

    await registered(AIChannels.ASSISTANT_DISPATCH_START)(sender, {
      streamId: 's1',
      command: dispatchCommand,
    });
    await vi.waitFor(() => expect(capturedSignal).toBeDefined());
    expect(capturedSignal?.aborted).toBe(false);

    moduleDef.destroy?.();
    expect(capturedSignal?.aborted).toBe(true);
  });
});
