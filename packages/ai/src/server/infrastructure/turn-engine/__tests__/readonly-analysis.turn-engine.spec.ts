import { describe, expect, it, vi } from 'vitest';
import type { IModelGatewayPort } from '@memoflow/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import {
  PI_READONLY_TURN_ENGINE_ID,
  ReadonlyAnalysisTurnEngine,
} from '../readonly-analysis.turn-engine';

function createProviderRepo(): IAIProviderConfigRepository {
  const provider = {
    id: 'provider-1',
    name: 'test',
    isActive: true,
    defaultModel: 'gpt-4o-mini',
    apiKey: 'sk-secret-key',
    baseUrl: 'https://api.example.test/v1',
    providerType: 'OpenAICompatible',
  };
  return {
    findByIdForIdentity: vi.fn().mockResolvedValue(provider),
    findDefaultByIdentityId: vi.fn().mockResolvedValue(provider),
    findByIdentityId: vi.fn().mockResolvedValue([provider]),
    save: vi.fn(),
    delete: vi.fn(),
  } as unknown as IAIProviderConfigRepository;
}

function createGateway(overrides: Partial<IModelGatewayPort> = {}): IModelGatewayPort {
  return {
    descriptor: {
      gatewayId: 'model.openai_compatible',
      kind: 'openai_compatible',
      placement: 'server',
      credentialsInEvents: false,
    },
    listModels: vi.fn(),
    complete: vi.fn().mockResolvedValue({
      content: 'analysis ok',
      modelBindingId: 'openai:gpt-4o-mini',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    }),
    stream: async function* () {
      yield { content: 'analysis ok', finishReason: 'stop' };
    },
    ...overrides,
  };
}

describe('ReadonlyAnalysisTurnEngine', () => {
  it('exposes engine.pi_readonly and implements ITurnEnginePort', () => {
    const engine = new ReadonlyAnalysisTurnEngine(createProviderRepo(), createGateway());
    expect(engine.engineId).toBe(PI_READONLY_TURN_ENGINE_ID);
    expect(engine.engineId).toBe('engine.pi_readonly');
  });

  it('completes a readonly analysis turn via Model Gateway', async () => {
    const gateway = createGateway();
    const engine = new ReadonlyAnalysisTurnEngine(createProviderRepo(), gateway);
    const result = await engine.startTurn({
      runId: 'run-1',
      identityId: 'user-1',
      message: 'Summarize this note',
    });
    expect(result.status).toBe('completed');
    expect(gateway.complete).toHaveBeenCalledOnce();
    const input = vi.mocked(gateway.complete).mock.calls[0][0];
    expect(input.messages[0]?.content).toMatch(/readonly analysis/i);
    expect(input.messages[0]?.content).toMatch(/cannot execute tools/i);
    expect(input.auth.apiKey).toBe('sk-secret-key');
    expect(JSON.stringify(result)).not.toContain('sk-secret-key');
  });

  it('fails closed on cross-identity run ownership reuse while first turn is in flight', async () => {
    let release: (() => void) | undefined;
    const gateway = createGateway({
      complete: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            release = () =>
              resolve({
                content: 'late',
                modelBindingId: 'b',
                usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              });
          }),
      ),
    });
    const engine = new ReadonlyAnalysisTurnEngine(createProviderRepo(), gateway);
    const first = engine.startTurn({
      runId: 'run-own',
      identityId: 'user-1',
      message: 'a',
    });
    // Allow first turn to register ownership.
    await Promise.resolve();
    const second = await engine.startTurn({
      runId: 'run-own',
      identityId: 'user-2',
      message: 'b',
    });
    expect(second.status).toBe('failed');
    expect(second.error).toMatch(/ownership/i);
    release?.();
    await first;
  });

  it('aborts an in-flight turn', async () => {
    let resolveComplete: ((value: unknown) => void) | undefined;
    const gateway = createGateway({
      complete: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveComplete = resolve;
          }),
      ),
    });
    const engine = new ReadonlyAnalysisTurnEngine(createProviderRepo(), gateway);
    const pending = engine.startTurn({
      runId: 'run-abort',
      identityId: 'user-1',
      message: 'hang',
    });
    await Promise.resolve();
    await engine.abort('run-abort');
    resolveComplete?.({
      content: 'ignored',
      modelBindingId: 'b',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    });
    const result = await pending;
    expect(result.status).toBe('aborted');
  });
});
