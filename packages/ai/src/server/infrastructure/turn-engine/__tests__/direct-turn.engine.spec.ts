import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DirectTurnEngine, DIRECT_TURN_ENGINE_ID } from '../direct-turn.engine';
import type { IAIChatExecutionPort } from '../../../application/ports';
import type { IAIConversationRepository } from '../../../domain/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';

const IDENTITY = 'identity-direct-turn-1';
const FOREIGN = 'identity-direct-turn-foreign';
const RUN = 'run-direct-turn-1';

function createChatPort(overrides: Partial<IAIChatExecutionPort> = {}): IAIChatExecutionPort {
  return {
    complete: vi.fn().mockResolvedValue({
      content: 'hello from direct turn',
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
    }),
    stream: async function* () {
      yield { content: 'hello', finishReason: 'stop' };
    },
    ...overrides,
  };
}

function createProviderRepo(
  overrides: Partial<IAIProviderConfigRepository> = {},
): IAIProviderConfigRepository {
  const provider = {
    id: 'provider-1',
    name: 'test',
    isActive: true,
    defaultModel: 'gpt-4o-mini',
    apiKey: 'sk-test',
    baseUrl: 'https://api.example.test/v1',
    providerType: 'OpenAICompatible',
  };
  return {
    findByIdForIdentity: vi.fn().mockResolvedValue(provider),
    findDefaultByIdentityId: vi.fn().mockResolvedValue(provider),
    findByIdentityId: vi.fn().mockResolvedValue([provider]),
    save: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as IAIProviderConfigRepository;
}

function createConversationRepo(
  overrides: Partial<IAIConversationRepository> = {},
): IAIConversationRepository {
  return {
    findByIdForIdentity: vi.fn().mockResolvedValue(null),
    save: vi.fn(),
    ...overrides,
  } as unknown as IAIConversationRepository;
}

describe('DirectTurnEngine', () => {
  let chat: IAIChatExecutionPort;
  let providers: IAIProviderConfigRepository;
  let conversations: IAIConversationRepository;
  let engine: DirectTurnEngine;

  beforeEach(() => {
    chat = createChatPort();
    providers = createProviderRepo();
    conversations = createConversationRepo();
    engine = new DirectTurnEngine(conversations, providers, chat);
  });

  it('exposes engine.direct_turn and implements ITurnEnginePort', () => {
    expect(engine.engineId).toBe(DIRECT_TURN_ENGINE_ID);
    expect(engine.engineId).toBe('engine.direct_turn');
  });

  it('completes an open turn without conversationId (analysis mode)', async () => {
    const result = await engine.startTurn({
      runId: RUN,
      identityId: IDENTITY,
      message: 'ping',
    });
    expect(result).toEqual({ status: 'completed' });
    expect(chat.complete).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(chat.complete).mock.calls[0]?.[0];
    expect(arg?.identityId).toBe(IDENTITY);
    expect(arg?.requestId).toBe(RUN);
    expect(arg?.messages.some((m) => m.role === 'user' && m.content === 'ping')).toBe(true);
    expect(conversations.save).not.toHaveBeenCalled();
  });

  it('fails closed on run ownership mismatch', async () => {
    await engine.startTurn({ runId: RUN, identityId: IDENTITY, message: 'first' });
    const foreign = await engine.startTurn({
      runId: RUN,
      identityId: FOREIGN,
      message: 'second',
    });
    expect(foreign).toEqual({ status: 'failed', error: 'OWNERSHIP_MISMATCH' });
  });

  it('returns aborted when signal is already aborted', async () => {
    const signal = AbortSignal.abort();
    const result = await engine.startTurn({
      runId: RUN,
      identityId: IDENTITY,
      message: 'ping',
      signal,
    });
    expect(result.status).toBe('aborted');
    expect(chat.complete).not.toHaveBeenCalled();
  });

  it('abort() cancels an in-flight complete call', async () => {
    let resolveComplete: (value: unknown) => void = () => undefined;
    chat = createChatPort({
      complete: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveComplete = resolve;
          }),
      ),
    });
    engine = new DirectTurnEngine(conversations, providers, chat);

    const pending = engine.startTurn({
      runId: RUN,
      identityId: IDENTITY,
      message: 'slow',
    });

    // allow startTurn to reach complete
    await Promise.resolve();
    await engine.abort(RUN);
    resolveComplete({
      content: 'late',
      finishReason: 'stop',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    });

    const result = await pending;
    expect(result.status).toBe('aborted');
  });

  it('fails closed when no provider is configured', async () => {
    providers = createProviderRepo({
      findDefaultByIdentityId: vi.fn().mockResolvedValue(null),
      findByIdentityId: vi.fn().mockResolvedValue([]),
    });
    engine = new DirectTurnEngine(conversations, providers, chat);
    const result = await engine.startTurn({
      runId: RUN,
      identityId: IDENTITY,
      message: 'ping',
    });
    expect(result).toEqual({ status: 'failed', error: 'PROVIDER_UNAVAILABLE' });
  });

  it('never claims waiting_approval (chat-only; no mutation tools)', async () => {
    const result = await engine.startTurn({
      runId: RUN,
      identityId: IDENTITY,
      message: 'ping',
    });
    expect(result.status).not.toBe('waiting_approval');
    expect(result.status).toBe('completed');
  });

  it('forwards the entry correlation requestId (not runId) as the internal requestId', async () => {
    const { AIConversation } = await import('../../../domain/aggregates/ai-conversation');
    const conversation = AIConversation.create({ identityId: IDENTITY, name: 'Test' });
    conversations = createConversationRepo({
      findByIdForIdentity: vi.fn().mockResolvedValue(conversation),
    });
    engine = new DirectTurnEngine(conversations, providers, chat);

    const result = await engine.executeConversationTurn({
      runId: RUN,
      requestId: 'entry-req-direct-turn-1',
      identityId: IDENTITY,
      conversationId: 'conv-1',
      message: 'ping',
    });
    expect(result.status).toBe('completed');
    const arg = vi.mocked(chat.complete).mock.calls[0]?.[0];
    expect(arg?.requestId).toBe('entry-req-direct-turn-1');
    // runId stays the durable ownership key — never the correlation ID.
    expect(arg?.requestId).not.toBe(RUN);
  });

  it('falls back to runId as the internal requestId when no entry correlation ID exists', async () => {
    const result = await engine.startTurn({
      runId: RUN,
      identityId: IDENTITY,
      message: 'ping',
    });
    expect(result.status).toBe('completed');
    const arg = vi.mocked(chat.complete).mock.calls[0]?.[0];
    expect(arg?.requestId).toBe(RUN);
  });
});
