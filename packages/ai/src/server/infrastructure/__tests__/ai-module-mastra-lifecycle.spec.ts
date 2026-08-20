import { describe, expect, it, vi } from 'vitest';
import { createAIModuleForTests } from '../../../testing/ai-test-support';
import type { MastraAIRuntime } from '../../mastra/runtime';
import type { AIModuleRuntimeContribution } from '../ai.module';

function fakeMastraRuntime(
  overrides: {
    init?: () => Promise<void>;
    dispose?: () => Promise<void>;
  } = {},
) {
  const init = vi.fn(overrides.init ?? (async () => {}));
  const dispose = vi.fn(overrides.dispose ?? (async () => {}));
  return {
    init,
    dispose,
    runtime: { init, dispose } as unknown as MastraAIRuntime,
  };
}

describe('createAIModule Mastra lifecycle', () => {
  it('awaits Mastra init after synchronous module contributions and disposes it with the module', async () => {
    const calls: string[] = [];
    const contribution: AIModuleRuntimeContribution = {
      start: vi.fn(() => calls.push('contribution:start')),
      stop: vi.fn(() => calls.push('contribution:stop')),
    };
    const mastra = fakeMastraRuntime({
      init: async () => {
        calls.push('mastra:init');
      },
      dispose: async () => {
        calls.push('mastra:dispose');
      },
    });
    const instance = createAIModuleForTests({
      runtimeContributions: contribution,
      mastraRuntime: mastra.runtime,
    });

    await instance.start();
    expect(calls.slice(0, 2)).toEqual(['contribution:start', 'mastra:init']);
    expect(instance.mastraRuntime).toBe(mastra.runtime);

    await instance.dispose();
    expect(calls).toEqual([
      'contribution:start',
      'mastra:init',
      'contribution:stop',
      'mastra:dispose',
    ]);
    expect(mastra.init).toHaveBeenCalledTimes(1);
    expect(mastra.dispose).toHaveBeenCalledTimes(1);
  });

  it('rolls back started contributions and disposes Mastra when init rejects', async () => {
    const originalError = new Error('mastra init failed');
    const contribution: AIModuleRuntimeContribution = {
      start: vi.fn(() => {}),
      stop: vi.fn(() => {}),
    };
    const mastra = fakeMastraRuntime({
      init: async () => {
        throw originalError;
      },
    });
    const instance = createAIModuleForTests({
      runtimeContributions: contribution,
      mastraRuntime: mastra.runtime,
    });

    await expect(instance.start()).rejects.toBe(originalError);
    expect(contribution.start).toHaveBeenCalledTimes(1);
    expect(contribution.stop).toHaveBeenCalledTimes(1);
    expect(mastra.dispose).toHaveBeenCalledTimes(1);

    await instance.dispose();
    expect(contribution.stop).toHaveBeenCalledTimes(1);
    expect(mastra.dispose).toHaveBeenCalledTimes(1);
  });
});
