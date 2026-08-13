/**
 * Governance Electron IPC Lifecycle Spec
 * 治理 Electron IPC 生命周期测试
 *
 * Verifies that createGovernanceElectronModule is a pure transport/lifecycle
 * adapter: it registers the 7 governance channels, starts the already-assembled
 * instance once, routes IPC calls through GovernanceController to the same
 * instance api, removes all channels on destroy, disposes exactly once, and
 * cleans up on start failure.
 *
 * 验证 createGovernanceElectronModule 是纯传输/生命周期适配器：
 * 注册 7 个治理通道、启动已装配实例一次、通过 GovernanceController 把 IPC
 * 调用路由到同一实例 api、destroy 时移除全部通道、恰好 dispose 一次，
 * 且 start 失败时执行清理。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type IElectronModuleContext } from '@memoflow/contracts/electron';
import { ok } from '@memoflow/contracts/result';
import { GovernanceChannels } from '@memoflow/contracts/governance';
import type { GovernanceApplicationPort } from '../server/application';
import type { GovernanceModuleInstance } from '../server/infrastructure';

const mocks = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => unknown>();
  const handle = vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
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

import { createGovernanceElectronModule } from './index';

function createApiStub(): GovernanceApplicationPort {
  return {
    createRule: vi.fn(() => ok(null as never)),
    updateRule: vi.fn(() => ok(null as never)),
    deleteRule: vi.fn(() => ok(null as never)),
    getRule: vi.fn(() => ok(null as never)),
    listRules: vi.fn(() => ok([] as never)),
    searchRules: vi.fn(() => ok([] as never)),
    getRevisions: vi.fn(() => ok(null as never)),
  } as GovernanceApplicationPort;
}

function createFakeInstance() {
  const api = createApiStub();
  const start = vi.fn();
  const dispose = vi.fn();
  const instance: GovernanceModuleInstance = { api, start, dispose };
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

describe('createGovernanceElectronModule IPC lifecycle', () => {
  let fake: ReturnType<typeof createFakeInstance>;
  let context: IElectronModuleContext;
  let moduleDef: ReturnType<typeof createGovernanceElectronModule>;

  beforeEach(() => {
    fake = createFakeInstance();
    context = createFakeContext();
    moduleDef = createGovernanceElectronModule({ instance: fake.instance });
  });

  afterEach(() => {
    moduleDef.destroy?.();
    vi.clearAllMocks();
    mocks.handlers.clear();
  });

  it('registers all 7 governance channels and starts the instance once', () => {
    moduleDef.register(context);

    for (const channel of Object.values(GovernanceChannels)) {
      expect(mocks.handlers.has(channel), `Expected ${channel} to be registered`).toBe(true);
    }
    expect(mocks.handlers.size).toBe(Object.values(GovernanceChannels).length);
    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('starts only once across repeated register calls (per-handle state, no second instance)', () => {
    moduleDef.register(context);
    moduleDef.register(context);

    expect(fake.start).toHaveBeenCalledTimes(1);
  });

  it('routes IPC calls through the controller to the same instance api', async () => {
    moduleDef.register(context);

    const listResult = await registered(GovernanceChannels.RULE_LIST)(undefined, {});
    expect(listResult).toMatchObject({ ok: true });
    expect(fake.api.listRules).toHaveBeenCalledTimes(1);

    const searchResult = await registered(GovernanceChannels.RULE_SEARCH)(
      undefined,
      { query: 'architecture' },
    );
    expect(searchResult).toMatchObject({ ok: true });
    expect(fake.api.searchRules).toHaveBeenCalledWith(
      expect.anything(),
      { identityId: 'identity-1' },
    );
  });

  it('destroy removes all channels and disposes exactly once (second call no-ops)', () => {
    moduleDef.register(context);

    moduleDef.destroy?.();
    for (const channel of Object.values(GovernanceChannels)) {
      expect(mocks.handlers.has(channel)).toBe(false);
    }
    expect(mocks.removeHandler).toHaveBeenCalledTimes(Object.values(GovernanceChannels).length);
    expect(fake.dispose).toHaveBeenCalledTimes(1);

    moduleDef.destroy?.();
    moduleDef.destroy?.();
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });

  it('disposes and rethrows when start() throws', () => {
    fake.start.mockImplementation(() => {
      throw new Error('start failed');
    });

    expect(() => moduleDef.register(context)).toThrow('start failed');
    expect(fake.dispose).toHaveBeenCalledTimes(1);
  });
});
