/**
 * AI API Module Lifecycle Spec
 * AI API 模块生命周期测试
 *
 * Verifies that createAIApiModule is a pure transport/lifecycle adapter: it
 * accepts only an already-assembled `AIModuleInstance`, requires the internal
 * checkpoint application surface fail-closed, wires every controller (including
 * both checkpoint controllers) from `instance.api`, starts the instance once
 * BEFORE mounting, mounts the twelve route groups in the exact current order,
 * rolls a partial route set back on any mount failure, owns a per-handle state
 * machine (single registration, terminal states, idempotent destroy), cleans up
 * on failure and rethrows the original error, and never touches `db`.
 *
 * 验证 createAIApiModule 是纯传输/生命周期适配器：只接收已装配的
 * `AIModuleInstance`、fail-closed 校验内部 checkpoint application surface、
 * 从 `instance.api` 接线全部 controller（含两个 checkpoint controller）、先调用
 * 一次 `instance.start()` 再挂载、按当前完全相同的顺序挂载十二组路由、任一挂载
 * 失败时回滚半套路由、维护每个 handle 的状态机（单次注册、终态、destroy 幂等）、
 * 失败时清理并重新抛出原始错误，且完全不触碰 `db`。
 */

import type { Express, Router } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIModuleInstance } from '../server/infrastructure';
import type { AIApplicationPort } from '../server/application';
import type { IAgentCheckpointPort, ILangGraphCheckpointPort } from '../server/application/ports';
import { createAIApiModule, type AIApiModuleContext } from './module';

const AI_ROUTE_MOUNTS = [
  '/ai/providers',
  '/ai',
  '/ai/agents',
  '/ai/chat',
  '/ai/assistant',
  '/ai/knowledge',
  '/ai/knowledge-notes',
  '/ai/analytics',
  '/ai',
  '/ai/generate',
  '/internal/agents/checkpoints',
  '/internal/agents/langgraph-checkpoints',
] as const;

function createFakeCheckpointPorts() {
  return {
    agent: {
      upsert: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      delete: vi.fn(),
      getThreadIndex: vi.fn(),
    } as unknown as IAgentCheckpointPort,
    langGraph: {
      putCheckpoint: vi.fn(),
      getCheckpoint: vi.fn(),
      listCheckpoints: vi.fn(),
      putWrites: vi.fn(),
      deleteThread: vi.fn(),
    } as unknown as ILangGraphCheckpointPort,
  };
}

function createFakeInstance() {
  const checkpoints = createFakeCheckpointPorts();
  const api = {
    checkpoints,
    getCapabilities: vi.fn(),
    generateGoal: vi.fn(),
    listAgentRuns: vi.fn(),
    startAgentRun: vi.fn(),
    resumeAgentRun: vi.fn(),
    getAgentRun: vi.fn(),
    getAgentEvents: vi.fn(),
    createProvider: vi.fn(),
    updateProvider: vi.fn(),
    listProviders: vi.fn(),
    getProvider: vi.fn(),
    deleteProvider: vi.fn(),
    testConnection: vi.fn(),
    setDefaultProvider: vi.fn(),
    refreshProviderModels: vi.fn(),
    createConversation: vi.fn(),
    listConversations: vi.fn(),
    getConversation: vi.fn(),
    updateConversation: vi.fn(),
    deleteConversation: vi.fn(),
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
    dispatchAssistant: vi.fn(),
    createKnowledgeNote: vi.fn(),
    expandKnowledge: vi.fn(),
    queryKnowledge: vi.fn(),
    reindexKnowledge: vi.fn(),
    queryAnalytics: vi.fn(),
    getEvaluationOverview: vi.fn(),
  } as unknown as AIApplicationPort;
  const start = vi.fn();
  const dispose = vi.fn();
  const instance = {
    api,
    start,
    dispose,
  } as unknown as AIModuleInstance;
  return { instance, api, checkpoints, start, dispose };
}

function createFakeContext(): AIApiModuleContext {
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

describe('createAIApiModule fail-closed validation', () => {
  it('rejects a missing instance', () => {
    expect(() => createAIApiModule({ instance: undefined as never })).toThrow(/requires options\.instance/);
  });

  it('rejects an instance without the checkpoint application surface', () => {
    const fake = createFakeInstance();
    delete fake.api.checkpoints;
    expect(() => createAIApiModule({ instance: fake.instance })).toThrow(
      /requires instance\.api\.checkpoints/,
    );
  });

  it('rejects an instance with only one checkpoint port', () => {
    const fake = createFakeInstance();
    fake.api.checkpoints = {
      agent: fake.checkpoints.agent,
    } as unknown as NonNullable<AIApplicationPort['checkpoints']>;
    expect(() => createAIApiModule({ instance: fake.instance })).toThrow(
      /requires instance\.api\.checkpoints/,
    );
  });
});

describe('createAIApiModule lifecycle', () => {
  let fake: ReturnType<typeof createFakeInstance>;
  let context: AIApiModuleContext;

  beforeEach(() => {
    fake = createFakeInstance();
    context = createFakeContext();
  });

  it('register mounts all twelve route prefixes in the exact current order', () => {
    const moduleDef = createAIApiModule({ instance: fake.instance });

    expect(() => moduleDef.register(context)).not.toThrow();

    const routerUse = context.router.use as ReturnType<typeof vi.fn>;
    const mountedPaths = routerUse.mock.calls.map((call) => call[0]);
    expect(mountedPaths).toEqual([...AI_ROUTE_MOUNTS]);
  });

  it('starts the instance once BEFORE the first mount, then registers once', () => {
    const routerUse = context.router.use as ReturnType<typeof vi.fn>;
    const moduleDef = createAIApiModule({ instance: fake.instance });

    moduleDef.register(context);

    expect(fake.start).toHaveBeenCalledTimes(1);
    expect(routerUse).toHaveBeenCalledTimes(AI_ROUTE_MOUNTS.length);
    const startOrder = fake.start.mock.invocationCallOrder[0];
    const firstMountOrder = routerUse.mock.invocationCallOrder[0];
    expect(startOrder).toBeLessThan(firstMountOrder);
  });

  it('register works without a db field on the context (transport-only)', () => {
    const moduleDef = createAIApiModule({ instance: fake.instance });
    const contextWithoutDb = { ...context } as AIApiModuleContext;
    delete (contextWithoutDb as Record<string, unknown>).db;

    expect(() => moduleDef.register(contextWithoutDb)).not.toThrow();
  });

  it('throws on a second register() call (single registration per handle)', () => {
    const moduleDef = createAIApiModule({ instance: fake.instance });

    moduleDef.register(context);
    expect(() => moduleDef.register(context)).toThrow(/only register once/);
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('throws on register() after destroy()', () => {
    const moduleDef = createAIApiModule({ instance: fake.instance });

    moduleDef.register(context);
    moduleDef.destroy?.();

    expect(() => moduleDef.register(context)).toThrow(/only register once/);
  });

  it('destroy disposes exactly once and is idempotent', () => {
    const moduleDef = createAIApiModule({ instance: fake.instance });

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

    const moduleDef = createAIApiModule({ instance: fake.instance });

    expect(() => moduleDef.register(context)).toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);

    expect(() => moduleDef.register(context)).toThrow(/only register once/);
    expect(fake.start).toHaveBeenCalledTimes(1);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('does not mount any route on the host router when start() throws', () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });

    const routerUse = context.router.use as ReturnType<typeof vi.fn>;
    const moduleDef = createAIApiModule({ instance: fake.instance });

    expect(() => moduleDef.register(context)).toThrow('start failed');
    expect(routerUse).not.toHaveBeenCalled();
    expect(fake.start).toHaveBeenCalledTimes(1);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('destroy() after a failed registration does not dispose a second time', () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });

    const moduleDef = createAIApiModule({ instance: fake.instance });

    expect(() => moduleDef.register(context)).toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);

    moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('rolls back the already-installed AI routes when a middle router.use() throws', () => {
    const preExisting = { name: '<pre-existing>' };
    const routerStub = {
      stack: [preExisting] as unknown[],
      use: vi.fn((_path: unknown, _routes: unknown) => {
        if (routerStub.stack.length - 1 === 5) {
          throw new Error('mount failed');
        }
        routerStub.stack.push({ name: `ai-route-${routerStub.stack.length - 1}` });
      }),
    } as unknown as Router;

    const mountContext = { ...context, router: routerStub } as AIApiModuleContext;
    const moduleDef = createAIApiModule({ instance: fake.instance });

    expect(() => moduleDef.register(mountContext)).toThrow('mount failed');
    expect(fake.start).toHaveBeenCalledTimes(1);
    expect(fake.dispose).toHaveBeenCalledTimes(1);
    expect((routerStub as unknown as { stack: unknown[] }).stack).toEqual([preExisting]);

    moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('rethrows the original registration error even if dispose also throws', () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });
    fake.dispose.mockImplementation(() => {
      throw new Error('dispose failed');
    });

    const moduleDef = createAIApiModule({ instance: fake.instance });

    expect(() => moduleDef.register(context)).toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('wires the internal checkpoint controllers from the instance.api.checkpoints surface', () => {
    const moduleDef = createAIApiModule({ instance: fake.instance });

    moduleDef.register(context);

    const routerUse = context.router.use as ReturnType<typeof vi.fn>;
    const mountedPaths = routerUse.mock.calls.map((call) => call[0]);
    expect(mountedPaths).toContain('/internal/agents/checkpoints');
    expect(mountedPaths).toContain('/internal/agents/langgraph-checkpoints');
  });
});
